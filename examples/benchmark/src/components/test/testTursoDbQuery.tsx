import { createEffect, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { sqlSchema } from '../../schema/schema.sql.ts'
import { generate, seed } from '../../util/dataGenerator.ts'
import { TursoDB } from '../database/tursoDB.tsx'
import { TestTemplate } from './testTemplate.tsx'

const yieldToUi = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })

const insertBatch = async (
  db: typeof TursoDB.defaultValue,
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
  const statement = db.prepare(
    `INSERT INTO ${table} (${columnList})
     VALUES ${placeholders.join(', ')}
     ON CONFLICT DO NOTHING`,
  )
  await statement.run(...params)
}

const seedTestData = async (db: typeof TursoDB.defaultValue) => {
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
  db: typeof TursoDB.defaultValue,
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

const clearTables = async (db: typeof TursoDB.defaultValue) => {
  await db.exec('DELETE FROM home_table')
  await db.exec('DELETE FROM locality_table')
  await db.exec('DELETE FROM home_feature_table')
}

export function TestTursoDbQuery(props: { query: string; rowCount: number }) {
  const db = useContext(TursoDB)
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
      await db.exec(sqlSchema)
      await db.exec('BEGIN')

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

      await db.exec('COMMIT')
      const insertDuration = performance.now() - insertStart
      setState({
        insertStatus: `${insertDuration.toFixed(1)} ms`,
        insertProgress: 100,
      })

      const queryStatement = db.prepare(props.query)
      const queryStart = performance.now()
      await queryStatement.all()
      const queryDuration = performance.now() - queryStart
      setState({ queryStatus: `${queryDuration.toFixed(1)} ms` })

      setState({
        testStatus: 'Finished',
        isFinished: true,
      })
    } catch (error) {
      try {
        await db.exec('ROLLBACK')
      } catch {
        // Ignore rollback failures.
      }
      const message =
        error instanceof Error ? error.stack || error.message : String(error)
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
      title="Turso query"
      subtitle="SQLite rust rewrite in WASM"
      isRunning={state.isRunning}
      isFinished={state.isFinished}
      hasError={Boolean(state.errorStatus)}
      onStart={() => void runTest()}
      onShowError={() => state.errorStatus}
      onShowResults={async () => {
        const statement = db.prepare(props.query)
        const results = await statement.all()
        return JSON.stringify(results, null, 2)
      }}
      rows={tableRows()}
    />
  )
}
