import { liveQuerySql } from '@menglinmaker/tanstack-db-sql-interpreter'
import { createCollection, liveQueryCollectionOptions } from '@tanstack/db'
import { createEffect, createResource, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { SqlTestProp } from '../../sqlTest.tsx'
import {
  type QueryResultPayload,
  TestTemplate,
} from '../components/testTemplate.tsx'
import { generate } from '../util/dataGenerator.ts'
import { formatTestError } from '../util/formatTestError.ts'
import { type TanstackCollections, tanstackDbFactory } from './util.ts'

export default function TestTanstackDbIvm(props: SqlTestProp) {
  const [collectionsResource] =
    createResource<TanstackCollections>(tanstackDbFactory)
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
  const insertBatch = (
    collections: TanstackCollections,
    tableName: string,
    rows: any[],
  ) => collections[tableName]!.insert(rows)

  const gen_home_table = generate.home_table()
  const seedTestData = (
    collections: TanstackCollections,
    seed: SqlTestProp['seed'],
  ) => {
    insertBatch(collections, 'home_feature_table', seed.home_feature_table)
    insertBatch(collections, 'locality_table', seed.locality_table)
    insertBatch(collections, 'home_table', [gen_home_table])
  }

  const insertTestDataNonBlocking = (
    collections: TanstackCollections,
    seed: SqlTestProp['seed'],
  ) => {
    const batchSize = 1000
    const count = seed.home_table.length
    for (let i = 0; i < count; i += batchSize) {
      const batchCount = Math.min(batchSize, count - i)
      // TODO: replace with seed
      const rows = Array.from({ length: batchCount }, () =>
        generate.home_table(),
      )
      insertBatch(collections, 'home_table', rows)
      const percentProgress = Math.round(
        Math.min(100, ((i + batchCount) / count) * 100),
      )
      console.debug(`Tanstack IVM test progress: ${percentProgress}%`)
    }
  }

  const clearCollections = async (collections: TanstackCollections) => {
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
      const collections = collectionsResource.latest
      if (!collections) throw new Error('TanstackDB is not ready yet')
      clearCollections(collections)

      const seedStart = performance.now()
      await seedTestData(collections, props.seed)
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
      insertTestDataNonBlocking(collections, props.seed)
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
      isInitializing={collectionsResource.loading}
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
