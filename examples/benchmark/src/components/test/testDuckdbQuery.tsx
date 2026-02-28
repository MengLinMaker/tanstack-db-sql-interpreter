import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm'
import { createEffect, createSignal, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { generate, seed } from '../../util/dataGenerator.ts'
import { formatTestError } from '../../util/formatTestError.ts'
import { DuckdbDB } from '../database/duckdbDB.tsx'
import { TestTemplate, type QueryResultPayload } from './testTemplate.tsx'

const yieldToUi = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })

type DuckdbResult = {
  toArray?: () => unknown[]
}

const normalizeRows = (result: unknown) => {
  const rows = (result as DuckdbResult | null)?.toArray?.()
  return rows ?? (result as unknown[])
}

const queryDuckdbRows = async (conn: AsyncDuckDBConnection, sql: string) => {
  const startedAt = performance.now()
  const result = await conn.query(sql)
  const rows = normalizeRows(result)
  const durationMs = performance.now() - startedAt
  return { rows, durationMs }
}

const getDuckdbRows = async (conn: AsyncDuckDBConnection, sql: string) => {
  const result = await conn.query(sql)
  return normalizeRows(result)
}

const insertBatch = async (
  conn: AsyncDuckDBConnection,
  table: string,
  columns: string[],
  rows: Array<Array<unknown>>,
) => {
  if (rows.length === 0) return
  const columnList = columns.join(', ')
  const placeholders: string[] = []
  const params: unknown[] = []
  rows.forEach((row) => {
    const rowPlaceholders = columns.map(() => `?`).join(', ')
    placeholders.push(`(${rowPlaceholders})`)
    params.push(...row)
  })
  const stmt = await conn.prepare(
    `INSERT INTO ${table} (${columnList})
     VALUES ${placeholders.join(', ')}`,
  )
  await stmt.query(...params)
  await stmt.close()
}

const seedTestData = async (conn: AsyncDuckDBConnection) => {
  const batchSize = 1000
  for (let i = 0; i < seed.home_feature_table.length; i += batchSize) {
    const batch = seed.home_feature_table.slice(i, i + batchSize)
    await insertBatch(
      conn,
      'home_feature_table',
      ['id', 'bed_quantity', 'bath_quantity', 'car_quantity'],
      batch.map((row) => [
        row.id,
        row.bed_quantity,
        row.bath_quantity,
        row.car_quantity,
      ]),
    )
    await yieldToUi()
  }
  for (let i = 0; i < seed.locality_table.length; i += batchSize) {
    const batch = seed.locality_table.slice(i, i + batchSize)
    await insertBatch(
      conn,
      'locality_table',
      ['id', 'suburb_name', 'postcode', 'state_abbreviation'],
      batch.map((row) => [
        row.id,
        row.suburb_name,
        row.postcode,
        row.state_abbreviation,
      ]),
    )
    await yieldToUi()
  }
}

const insertTestDataNonBlocking = async (
  conn: AsyncDuckDBConnection,
  count: number,
  onProgress?: (current: number) => void,
) => {
  const batchSize = 1000
  const columns = [
    'id',
    'locality_table_id',
    'home_feature_table_id',
    'street_address',
    'higher_price_aud',
  ]
  for (let i = 0; i < count; i += batchSize) {
    const batchCount = Math.min(batchSize, count - i)
    const rows: Array<Array<unknown>> = []
    for (let j = 0; j < batchCount; j++) {
      const row = generate.home_table()
      rows.push([
        row.id,
        row.locality_table_id,
        row.home_feature_table_id,
        row.street_address,
        row.higher_price_aud,
      ])
    }
    await insertBatch(conn, 'home_table', columns, rows)
    onProgress?.(i + batchCount)
    await yieldToUi()
  }
}

const clearTables = async (conn: AsyncDuckDBConnection) => {
  await conn.query('DELETE FROM home_table')
  await conn.query('DELETE FROM locality_table')
  await conn.query('DELETE FROM home_feature_table')
}

export function TestDuckdbQuery(props: { query: string; rowCount: number }) {
  const db = useContext(DuckdbDB)
  const [queryResult, setQueryResult] = createSignal<unknown[]>([])
  const [state, setState] = createStore({
    insertStatus: '',
    seedStatus: '',
    errorStatus: '',
    isRunning: false,
    testStatus: '',
    isFinished: false,
    queryStatus: '',
    insertProgress: 0,
  })

  const runTest = async () => {
    setState({
      isRunning: true,
      isFinished: false,
      errorStatus: '',
      testStatus: 'Running…',
      seedStatus: '',
      insertStatus: '',
      queryStatus: '',
    })

    let conn: AsyncDuckDBConnection | null = null
    try {
      conn = await db.connect()
      await clearTables(conn)

      const seedStart = performance.now()
      await seedTestData(conn)
      const seedDuration = performance.now() - seedStart
      setState({ seedStatus: `${seedDuration.toFixed(1)} ms` })

      const insertStart = performance.now()
      const homeRows = props.rowCount
      await insertTestDataNonBlocking(conn, homeRows, (current) => {
        const progress = Math.min(100, (current / homeRows) * 100)
        setState({
          insertStatus: 'Inserting…',
          insertProgress: progress,
        })
      })
      const insertDuration = performance.now() - insertStart
      setState({
        insertStatus: `${insertDuration.toFixed(1)} ms`,
        insertProgress: 100,
      })

      const { rows, durationMs } = await queryDuckdbRows(conn, props.query)
      setQueryResult(Array.isArray(rows) ? rows : [rows])
      setState({ queryStatus: `${durationMs.toFixed(1)} ms` })

      setState({
        testStatus: 'Finished',
        isFinished: true,
      })
    } catch (error) {
      if (error instanceof Error) {
        console.error(error)
      }
      setState({
        errorStatus: formatTestError(error),
        testStatus: 'Test failed',
      })
    } finally {
      await conn?.close()
      setState({
        isRunning: false,
      })
    }
  }

  createEffect(() => {
    props.query
    props.rowCount
    setQueryResult([])
    setState({
      insertStatus: '',
      seedStatus: '',
      errorStatus: '',
      isRunning: false,
      testStatus: '',
      isFinished: false,
      queryStatus: '',
      insertProgress: 0,
    })
  })

  const tableRows = () => [
    {
      label: 'Status',
      value: state.errorStatus ? 'Error' : state.testStatus || 'Idle',
    },
    { label: 'Query time', value: state.queryStatus || '—' },
    { label: 'Seed time', value: state.seedStatus || '—' },
    {
      label: 'Insert time',
      value: state.insertStatus || '—',
      barPercent: state.insertProgress,
    },
  ]

  return (
    <TestTemplate
      title="DuckDB query"
      subtitle="DuckDB in WebAssembly"
      isRunning={state.isRunning}
      isFinished={state.isFinished}
      hasError={Boolean(state.errorStatus)}
      onStart={() => void runTest()}
      onShowError={() => state.errorStatus}
      onShowResults={() =>
        ({
          rows: queryResult(),
        }) satisfies QueryResultPayload
      }
      rows={tableRows()}
    />
  )
}
