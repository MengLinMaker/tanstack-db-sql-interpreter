import { createEffect, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { generate, seed } from '../../util/dataGenerator.ts'
import { SqliteDB } from '../database/sqliteDB.tsx'
import { TestTemplate } from './testTemplate.tsx'

const yieldToUi = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })

const insertHomeFeatureBatch = async (
  db: typeof SqliteDB.defaultValue,
  rows: Array<{
    id: number
    bed_quantity: number
    bath_quantity: number
    car_quantity: number
  }>,
) =>
  db.batch((sql) =>
    rows.map(
      (row) =>
        sql`INSERT INTO home_feature_table (id, bed_quantity, bath_quantity, car_quantity)
            VALUES (${row.id}, ${row.bed_quantity}, ${row.bath_quantity}, ${row.car_quantity})`,
    ),
  )

const insertLocalityBatch = async (
  db: typeof SqliteDB.defaultValue,
  rows: Array<{
    id: number
    suburb_name: string
    postcode: string
    state_abbreviation: string
  }>,
) =>
  db.batch((sql) =>
    rows.map(
      (row) =>
        sql`INSERT INTO locality_table (id, suburb_name, postcode, state_abbreviation)
            VALUES (${row.id}, ${row.suburb_name}, ${row.postcode}, ${row.state_abbreviation})`,
    ),
  )

const insertHomeBatch = async (
  db: typeof SqliteDB.defaultValue,
  rows: Array<{
    id: number
    locality_table_id: number
    home_feature_table_id: number
    street_address: string
    higher_price_aud: number
  }>,
) =>
  db.batch((sql) =>
    rows.map(
      (row) =>
        sql`INSERT INTO home_table (id, locality_table_id, home_feature_table_id, street_address, higher_price_aud)
            VALUES (${row.id}, ${row.locality_table_id}, ${row.home_feature_table_id}, ${row.street_address}, ${row.higher_price_aud})`,
    ),
  )

const seedTestData = async (db: typeof SqliteDB.defaultValue) => {
  const batchSize = 500
  for (let i = 0; i < seed.home_feature_table.length; i += batchSize) {
    await insertHomeFeatureBatch(
      db,
      seed.home_feature_table.slice(i, i + batchSize),
    )
    await yieldToUi()
  }
  for (let i = 0; i < seed.locality_table.length; i += batchSize) {
    await insertLocalityBatch(db, seed.locality_table.slice(i, i + batchSize))
    await yieldToUi()
  }
}

const insertTestDataNonBlocking = async (
  db: typeof SqliteDB.defaultValue,
  count: number,
  onProgress?: (current: number) => void,
) => {
  const batchSize = 500
  for (let i = 0; i < count; i += batchSize) {
    const batchCount = Math.min(batchSize, count - i)
    const rows = Array.from({ length: batchCount }, () => generate.home_table())
    await insertHomeBatch(db, rows)
    onProgress?.(i + batchCount)
    await yieldToUi()
  }
}

const clearTables = async (db: typeof SqliteDB.defaultValue) => {
  await db.batch((sql) => [
    sql`DELETE FROM home_table`,
    sql`DELETE FROM locality_table`,
    sql`DELETE FROM home_feature_table`,
  ])
}

export function TestSqliteQuery(props: { query: string; rowCount: number }) {
  const db = useContext(SqliteDB)
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
      await clearTables(db)

      const seedStart = performance.now()
      await seedTestData(db)
      const seedDuration = performance.now() - seedStart
      setState({ seedStatus: `${seedDuration.toFixed(1)} ms` })

      const insertStart = performance.now()
      const homeRows = props.rowCount
      await insertTestDataNonBlocking(db, homeRows, (current) => {
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
      await db.sql([props.query] as unknown as TemplateStringsArray)
      const queryDuration = performance.now() - queryStart
      setState({ queryStatus: `${queryDuration.toFixed(1)} ms` })

      setState({
        testStatus: 'Finished',
        isFinished: true,
      })
    } catch (error) {
      let message =
        error instanceof Error ? error.stack || error.message : String(error)
      if (
        error instanceof Error &&
        'cause' in error &&
        error.cause instanceof Error
      ) {
        const cause = error.cause
        message += `\n\nCaused by:\n${cause.stack || cause.message}`
      }
      if (error instanceof Error) {
        console.error(error)
      }
      setState({
        errorStatus: message,
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
      isRunning={state.isRunning}
      isFinished={state.isFinished}
      hasError={Boolean(state.errorStatus)}
      onStart={() => void runTest()}
      onShowError={() => state.errorStatus}
      onShowResults={async () => {
        const result = await db.sql([
          props.query,
        ] as unknown as TemplateStringsArray)
        return JSON.stringify(result, null, 2)
      }}
      rows={tableRows()}
    />
  )
}
