import type { AsyncDuckDB, AsyncDuckDBConnection } from '@akabana/duckdb-wasm'
import { tableFromArrays, tableToIPC } from 'apache-arrow'
import { createEffect, createResource, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import {
  type QueryResultPayload,
  TestTemplate,
} from '../components/testTemplate.tsx'
import { generate, seed } from '../util/dataGenerator.ts'
import { formatTestError } from '../util/formatTestError.ts'
import { duckdbFactory } from './util.ts'

const yieldToUi = () =>
  new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))

const rowsToColumns = (rows: Record<string, any>[]) => {
  const columns: Record<string, any[]> = {}
  const keys = Object.keys(rows[0]!)
  for (const key of keys) columns[key] = rows.map((o) => o[key])
  return columns
}

const insertBatch = async (
  conn: AsyncDuckDBConnection,
  columns: Record<string, any[]>,
  tableName: string,
) => {
  const table = tableFromArrays(columns)
  const ipc = tableToIPC(table)
  await conn.insertArrowFromIPCStream(ipc, {
    name: tableName,
    create: false, // Append to existing data
  })
}

const home_feature_table_column = rowsToColumns(seed.home_feature_table)
const locality_table_column = rowsToColumns(seed.locality_table)
const seedTestData = async (conn: AsyncDuckDBConnection) => {
  await insertBatch(conn, home_feature_table_column, 'home_feature_table')
  await insertBatch(conn, locality_table_column, 'locality_table')
  await yieldToUi()
}

const insertTestDataNonBlocking = async (
  conn: AsyncDuckDBConnection,
  count: number,
  onProgress?: (current: number) => void,
) => {
  const batchSize = 10000
  for (let i = 0; i < count; i += batchSize) {
    const batchCount = Math.min(batchSize, count - i)
    const rows = Array.from({ length: batchCount }, () => generate.home_table())
    await insertBatch(conn, rowsToColumns(rows), 'home_table')
    onProgress?.(i + batchCount)
    await yieldToUi()
  }
}

const clearTables = async (conn: AsyncDuckDBConnection) => {
  await conn.query('DELETE FROM home_table')
  await conn.query('DELETE FROM locality_table')
  await conn.query('DELETE FROM home_feature_table')
}

export default function TestDuckdbQuery(props: {
  query: string
  rowCount: number
}) {
  const [dbResource] = createResource<AsyncDuckDB>(duckdbFactory)
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
      const db = dbResource.latest
      if (!db) throw new Error('DuckDB is not ready yet')
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

      const queryStart = performance.now()
      const result = await conn.query(props.query)
      const rows = result.toArray()
      const queryDuration = performance.now() - queryStart
      setQueryResult(rows)
      setState({
        queryStatus: `${queryDuration.toFixed(1)} ms`,
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
      isInitializing={dbResource.loading}
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
