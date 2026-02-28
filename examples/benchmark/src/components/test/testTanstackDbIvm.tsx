import { liveQuerySql } from '@menglinmaker/tanstack-db-sql-interpreter'
import { createCollection, liveQueryCollectionOptions } from '@tanstack/db'
import { createEffect, createSignal, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { generate, seed } from '../../util/dataGenerator.ts'
import { formatTestError } from '../../util/formatTestError.ts'
import { TanstackDB } from '../database/tanstackDB.tsx'
import { TestTemplate, type QueryResultPayload } from './testTemplate.tsx'

export function TestTanstackDbIvm(props: { query: string; rowCount: number }) {
  const collections = useContext(TanstackDB)
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
  const [queryResult, setQueryResult] = createSignal<unknown[]>([])
  const insertBatch = (tableName: string, rows: any[]) =>
    collections[tableName]!.insert(rows)

  const seedTestData = () => {
    insertBatch('home_feature_table', seed.home_feature_table)
    insertBatch('locality_table', seed.locality_table)
    insertBatch('home_table', [generate.home_table()])
  }

  const insertTestDataNonBlocking = (count: number) => {
    const batchSize = 1000
    for (let i = 0; i < count; i += batchSize) {
      const batchCount = Math.min(batchSize, count - i)
      const rows = Array.from({ length: batchCount }, () =>
        generate.home_table(),
      )
      insertBatch('home_table', rows)
      const percentProgress = Math.round(
        Math.min(100, ((i + batchCount) / count) * 100),
      )
      console.debug(`Tanstack IVM test progress: ${percentProgress}%`)
    }
  }

  const clearCollections = async () => {
    for (const collection of Object.values(collections)) {
      const keys = Array.from(collection.state.keys())
      if (keys.length > 0) {
        collection.delete(keys)
      }
    }
  }

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
      clearCollections()

      const seedStart = performance.now()
      await seedTestData()
      const seedDuration = performance.now() - seedStart
      setState({ seedStatus: `${seedDuration.toFixed(1)} ms` })

      const query = liveQuerySql(collections as never, props.query)
      const liveCollection = createCollection(
        liveQueryCollectionOptions({
          query: query as never,
          startSync: true,
        }),
      )

      const insertStart = performance.now()
      setState({
        insertStatus: 'Inserting…',
        insertProgress: 0,
      })
      const homeRows = props.rowCount
      insertTestDataNonBlocking(homeRows)
      const insertDuration = performance.now() - insertStart
      setState({
        insertStatus: `${insertDuration.toFixed(1)} ms`,
        insertProgress: 100,
      })
      setState({
        testStatus: 'Finished',
        isFinished: true,
      })

      const startedAt = performance.now()
      const results = liveCollection.toArray
      setQueryResult(results)
      const duration = performance.now() - startedAt
      setState({ queryStatus: `${duration.toFixed(1)} ms` })
    } catch (error) {
      console.error(error)
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
      title="Tanstack IVM"
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
