import { liveQuerySql } from '@menglinmaker/tanstack-db-sql-interpreter'
import { createCollection, liveQueryCollectionOptions } from '@tanstack/db'
import { createEffect, createSignal, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { generate, seed } from '../../util/dataGenerator.ts'
import { TanstackDB } from '../database/tanstackDB.tsx'
import { TestTemplate } from './testTemplate.tsx'

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
    const batchSize = 1000
    for (let i = 0; i < seed.home_feature_table.length; i += batchSize) {
      const batch = seed.home_feature_table.slice(i, i + batchSize)
      insertBatch('home_feature_table', batch)
    }
    for (let i = 0; i < seed.locality_table.length; i += batchSize) {
      const batch = seed.locality_table.slice(i, i + batchSize)
      insertBatch('locality_table', batch)
    }
    insertBatch('home_table', [generate.home_table()])
  }

  const insertTestDataNonBlocking = async (
    count: number,
    onProgress?: (current: number) => void,
  ) => {
    const batchSize = 1000
    for (let i = 0; i < count; i += batchSize) {
      const batchCount = Math.min(batchSize, count - i)
      const rows = Array.from({ length: batchCount }, () =>
        generate.home_table(),
      )
      insertBatch('home_table', rows)
      onProgress?.(i + batchCount)
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
      const homeRows = props.rowCount
      await insertTestDataNonBlocking(homeRows, (current) => {
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
      const message =
        error instanceof Error
          ? error.stack || error.message
          : String(error)
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
      title="Tanstack IVM"
      subtitle="Live query SQL interpreter"
      isRunning={state.isRunning}
      isFinished={state.isFinished}
      hasError={Boolean(state.errorStatus)}
      onStart={() => void runTest()}
      onShowError={() => state.errorStatus}
      onShowResults={() => JSON.stringify(queryResult(), null, 2)}
      rows={tableRows()}
    />
  )
}
