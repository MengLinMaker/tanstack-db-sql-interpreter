import { createEffect, createSignal, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import {
  type QueryResultPayload,
  TestTemplate,
} from '../components/testTemplate.tsx'
import { generate, seed } from '../util/dataGenerator.ts'
import { formatTestError } from '../util/formatTestError.ts'
import { PgliteDB } from './pgliteDB.tsx'

const yieldToUi = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })

const insertBatch = async (
  db: typeof PgliteDB.defaultValue,
  table: string,
  columns: string[],
  rows: Array<Array<unknown>>,
) => {
  if (rows.length === 0) return
  const columnList = columns.join(', ')
  const placeholders: string[] = []
  const params: unknown[] = []
  rows.forEach((row, rowIndex) => {
    const offset = rowIndex * columns.length
    const rowPlaceholders = columns
      .map((_, colIndex) => `$${offset + colIndex + 1}`)
      .join(', ')
    placeholders.push(`(${rowPlaceholders})`)
    params.push(...row)
  })
  await db.query(
    `INSERT INTO ${table} (${columnList})
     VALUES ${placeholders.join(', ')}`,
    params,
  )
}

const seedTestData = async (db: typeof PgliteDB.defaultValue) => {
  const batchSize = 1000
  for (let i = 0; i < seed.home_feature_table.length; i += batchSize) {
    const batch = seed.home_feature_table.slice(i, i + batchSize)
    await insertBatch(
      db,
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
      db,
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
  db: typeof PgliteDB.defaultValue,
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
    await insertBatch(db, 'home_table', columns, rows)
    onProgress?.(i + batchCount)
    await yieldToUi()
  }
}

const clearTables = async (db: typeof PgliteDB.defaultValue) => {
  await db.exec(
    'TRUNCATE TABLE home_table, locality_table, home_feature_table RESTART IDENTITY CASCADE',
  )
  await db.exec('VACUUM FULL')
}

export function TestPgliteDbQuery(props: { query: string; rowCount: number }) {
  const db = useContext(PgliteDB)
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

    try {
      await clearTables(db)

      const seedStart = performance.now()
      await seedTestData(db)
      const seedDuration = performance.now() - seedStart
      setState({ seedStatus: `${seedDuration.toFixed(1)} ms` })

      const insertStart = performance.now()
      await insertTestDataNonBlocking(db, props.rowCount, (current) => {
        const progress = Math.min(100, (current / props.rowCount) * 100)
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
      const queryResult = await db.query(props.query)
      const queryDuration = performance.now() - queryStart
      setQueryResult(queryResult.rows)
      setState({ queryStatus: `${queryDuration.toFixed(1)} ms` })
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

  return (
    <TestTemplate
      title="Pglite query"
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
