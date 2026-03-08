import { createEffect, createResource, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { SqlTestProp } from '../../sqlTest.tsx'
import {
  type QueryResultPayload,
  TestTemplate,
} from '../components/testTemplate.tsx'
import { generate } from '../util/dataGenerator.ts'
import { formatTestError } from '../util/formatTestError.ts'
import { type SqliteDb, sqliteFactory } from './util.ts'

const yieldToUi = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })

const sqlValue = (value: unknown) => {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number')
    return Number.isFinite(value) ? `${value}` : 'NULL'
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  return `'${String(value).replace(/'/g, "''")}'`
}

const insertHomeFeatureBatch = async (
  db: SqliteDb,
  rows: Array<{
    id: number
    bed_quantity: number
    bath_quantity: number
    car_quantity: number
  }>,
) =>
  db.sql(
    `INSERT INTO home_feature_table (id, bed_quantity, bath_quantity, car_quantity) VALUES ${rows
      .map(
        (row) =>
          `(${row.id}, ${row.bed_quantity}, ${row.bath_quantity}, ${row.car_quantity})`,
      )
      .join(', ')};`,
  )

const insertLocalityBatch = async (
  db: SqliteDb,
  rows: Array<{
    id: number
    suburb_name: string
    postcode: string
    state_abbreviation: string
  }>,
) =>
  db.sql(
    `INSERT INTO locality_table (id, suburb_name, postcode, state_abbreviation) VALUES ${rows
      .map(
        (row) =>
          `(${row.id}, ${sqlValue(row.suburb_name)}, ${sqlValue(row.postcode)}, ${sqlValue(row.state_abbreviation)})`,
      )
      .join(', ')};`,
  )

const insertHomeBatch = async (
  db: SqliteDb,
  rows: Array<{
    id: number
    locality_table_id: number
    home_feature_table_id: number
    street_address: string
    higher_price_aud: number
  }>,
) =>
  db.sql(
    `INSERT INTO home_table (id, locality_table_id, home_feature_table_id, street_address, higher_price_aud) VALUES ${rows
      .map(
        (row) =>
          `(${row.id}, ${row.locality_table_id}, ${row.home_feature_table_id}, ${sqlValue(row.street_address)}, ${row.higher_price_aud})`,
      )
      .join(', ')};`,
  )

const seedTestData = async (db: SqliteDb, seed: SqlTestProp['seed']) => {
  await insertHomeFeatureBatch(db, seed.home_feature_table)
  await insertLocalityBatch(db, seed.locality_table)
  await yieldToUi()
}

const insertTestDataNonBlocking = async (
  db: SqliteDb,
  seed: SqlTestProp['seed'],
  onProgress?: (current: number) => void,
) => {
  const batchSize = 10000
  const count = seed.home_table.length
  for (let i = 0; i < count; i += batchSize) {
    const batchCount = Math.min(batchSize, count - i)
    // TODO: replace with seed
    const rows = Array.from({ length: batchCount }, () => generate.home_table())
    await insertHomeBatch(db, rows)
    onProgress?.(i + batchCount)
    if (((i / batchSize) & 1) === 1) {
      await yieldToUi()
    }
  }
}

const clearTables = async (db: SqliteDb) => {
  await db.batch((sql) => [
    sql`DELETE FROM home_table`,
    sql`DELETE FROM locality_table`,
    sql`DELETE FROM home_feature_table`,
  ])
}

export default function TestSqliteQuery(props: SqlTestProp) {
  const [dbResource] = createResource<SqliteDb>(sqliteFactory)
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

    try {
      const db = dbResource.latest
      if (!db) throw new Error('SQLite is not ready yet')
      await clearTables(db)

      const seedStart = performance.now()
      await seedTestData(db, props.seed)
      const seedDuration = performance.now() - seedStart
      setState({ seedStatus: `${seedDuration.toFixed(1)} ms` })

      const insertStart = performance.now()
      const homeRows = props.rowCount
      await insertTestDataNonBlocking(db, props.seed, (current) => {
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
      const result = await db.sql([
        props.query,
      ] as unknown as TemplateStringsArray)
      const queryDuration = performance.now() - queryStart
      setQueryResult(Array.isArray(result) ? result : [])
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
      title="SQLite query"
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
