import { type Component, For, lazy, Suspense } from 'solid-js'

const UsageMonitor = lazy(() => import('./monitor/usageMonitor.tsx'))

const tests: Component<{ query: string; rowCount: number }>[] = [
  lazy(() => import('./database/tanstackDB/testTanstackDbIvm.tsx')),
  lazy(() => import('./database/duckDB/testDuckdbQuery.tsx')),
  lazy(() => import('./database/stoolapDB/testStoolapQuery.tsx')),
  lazy(() => import('./database/sqliteDB/testSqliteQuery.tsx')),
  lazy(() => import('./database/turso/testTursoDbQuery.tsx')),
  lazy(() => import('./database/pgliteDB/testPgliteDbIvm.tsx')),
  lazy(() => import('./database/pgliteDB/testPgliteDbQuery.tsx')),
]

export default function SqlTest(props: { query: string; rowCount: number }) {
  return (
    <section class="grid">
      <Suspense fallback={<div class="card" />}>
        <UsageMonitor intervalMs={100}></UsageMonitor>
      </Suspense>

      <For each={tests}>
        {(Test) => (
          <Suspense fallback={<div class="card" />}>
            <Test query={props.query} rowCount={props.rowCount} />
          </Suspense>
        )}
      </For>
    </section>
  )
}
