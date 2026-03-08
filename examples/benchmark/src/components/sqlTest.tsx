import { type Component, For, lazy, Suspense } from 'solid-js'
import type { z } from 'zod/mini'
import type { schemaZod } from './database/util/schema/collections.ts'

const UsageMonitor = lazy(() => import('./monitor/usageMonitor.tsx'))

export type SqlTestProp = {
  query: string
  rowCount: number
  seed: {
    home_feature_table: z.infer<typeof schemaZod.home_feature_table>[]
    locality_table: z.infer<typeof schemaZod.locality_table>[]
    home_table: z.infer<typeof schemaZod.home_table>[]
  }
}

const tests: Component<SqlTestProp>[] = [
  lazy(() => import('./database/tanstackDB/testTanstackDbIvm.tsx')),
  lazy(() => import('./database/duckDB/testDuckdbQuery.tsx')),
  lazy(() => import('./database/stoolapDB/testStoolapQuery.tsx')),
  lazy(() => import('./database/sqliteDB/testSqliteQuery.tsx')),
  lazy(() => import('./database/turso/testTursoDbQuery.tsx')),
  lazy(() => import('./database/pgliteDB/testPgliteDbIvm.tsx')),
  lazy(() => import('./database/pgliteDB/testPgliteDbQuery.tsx')),
]

export default function SqlTest(props: SqlTestProp) {
  return (
    <section class="grid">
      <Suspense fallback={<div class="card" />}>
        <UsageMonitor intervalMs={100}></UsageMonitor>
      </Suspense>

      <For each={tests}>
        {(Test) => (
          <Suspense fallback={<div class="card" />}>
            <Test
              query={props.query}
              rowCount={props.rowCount}
              seed={props.seed}
            />
          </Suspense>
        )}
      </For>
    </section>
  )
}
