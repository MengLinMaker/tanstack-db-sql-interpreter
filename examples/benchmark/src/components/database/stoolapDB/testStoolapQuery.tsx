import { createEffect, createResource, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import {
  type QueryResultPayload,
  TestTemplate,
} from '../components/testTemplate.tsx'
import { generate, seed } from '../util/dataGenerator.ts'
import { formatTestError } from '../util/formatTestError.ts'
import {
  executeStoolap,
  executeStoolapBatch,
  type StoolapDatabase,
  type StoolapExecuteRows,
  stoolapFactory,
} from './util.ts'

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

const toRowObjects = (result: StoolapExecuteRows) =>
  result.rows.map((row) => {
    const obj: Record<string, unknown> = {}
    result.columns.forEach((column, index) => {
      obj[column] = row[index] ?? null
    })
    return obj
  })

const insertHomeFeatureBatchSql = (
  rows: Array<{
    id: number
    bed_quantity: number
    bath_quantity: number
    car_quantity: number
  }>,
) =>
  `INSERT INTO home_feature_table (id, bed_quantity, bath_quantity, car_quantity) VALUES ${rows
    .map(
      (row) =>
        `(${row.id}, ${row.bed_quantity}, ${row.bath_quantity}, ${row.car_quantity})`,
    )
    .join(', ')};`

const insertLocalityBatchSql = (
  rows: Array<{
    id: number
    suburb_name: string
    postcode: string
    state_abbreviation: string
  }>,
) =>
  `INSERT INTO locality_table (id, suburb_name, postcode, state_abbreviation) VALUES ${rows
    .map(
      (row) =>
        `(${row.id}, ${sqlValue(row.suburb_name)}, ${sqlValue(row.postcode)}, ${sqlValue(row.state_abbreviation)})`,
    )
    .join(', ')};`

const insertHomeBatchSql = (
  rows: Array<{
    id: number
    locality_table_id: number
    home_feature_table_id: number
    street_address: string
    higher_price_aud: number
  }>,
) =>
  `INSERT INTO home_table (id, locality_table_id, home_feature_table_id, street_address, higher_price_aud) VALUES ${rows
    .map(
      (row) =>
        `(${row.id}, ${row.locality_table_id}, ${row.home_feature_table_id}, ${sqlValue(row.street_address)}, ${row.higher_price_aud})`,
    )
    .join(', ')};`

const seedTestData = async (db: StoolapDatabase) => {
  const batchSize = 2000
  for (let i = 0; i < seed.home_feature_table.length; i += batchSize) {
    executeStoolapBatch(
      db,
      insertHomeFeatureBatchSql(
        seed.home_feature_table.slice(i, i + batchSize),
      ),
    )
  }
  for (let i = 0; i < seed.locality_table.length; i += batchSize) {
    executeStoolapBatch(
      db,
      insertLocalityBatchSql(seed.locality_table.slice(i, i + batchSize)),
    )
    if (((i / batchSize) & 1) === 1) {
      await yieldToUi()
    }
  }
}

const insertTestDataNonBlocking = async (
  db: StoolapDatabase,
  count: number,
  onProgress?: (current: number) => void,
) => {
  const batchSize = 2000
  for (let i = 0; i < count; i += batchSize) {
    const batchCount = Math.min(batchSize, count - i)
    const rows = Array.from({ length: batchCount }, () => generate.home_table())
    executeStoolapBatch(db, insertHomeBatchSql(rows))
    onProgress?.(i + batchCount)
    if (((i / batchSize) & 1) === 1) {
      await yieldToUi()
    }
  }
}

const clearTables = (db: StoolapDatabase) => {
  executeStoolapBatch(
    db,
    `
    TRUNCATE home_table;
    TRUNCATE locality_table;
    TRUNCATE home_feature_table;
  `,
  )
}

export default function TestStoolapQuery(props: {
  query: string
  rowCount: number
}) {
  const [dbResource] = createResource<StoolapDatabase>(stoolapFactory)
  const [queryResult, setQueryResult] = createSignal<unknown[]>([])
  const [queryColumns, setQueryColumns] = createSignal<string[]>([])
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
      insertProgress: 0,
    })

    try {
      const db = dbResource.latest
      if (!db) throw new Error('Stoolap is not ready yet')
      clearTables(db)

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
      const result = executeStoolap(db, props.query)
      const queryDuration = performance.now() - queryStart
      if (result.type === 'rows') {
        setQueryResult(toRowObjects(result))
        setQueryColumns(result.columns)
      } else {
        setQueryResult([])
        setQueryColumns([])
      }
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
    setQueryColumns([])
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
      title="Stoolap query"
      isInitializing={dbResource.loading}
      isRunning={state.isRunning}
      isFinished={state.isFinished}
      hasError={Boolean(state.errorStatus)}
      onStart={() => void runTest()}
      onShowError={() => state.errorStatus}
      onShowResults={() =>
        ({
          rows: queryResult(),
          columns: queryColumns(),
        }) satisfies QueryResultPayload
      }
      rows={tableRows()}
    />
  )
}
