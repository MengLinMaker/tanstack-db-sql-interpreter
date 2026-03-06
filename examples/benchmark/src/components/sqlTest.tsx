import { PGlite } from '@electric-sql/pglite'
import { type Component, For, Suspense } from 'solid-js'
import { UsageMonitor } from './monitor/usageMonitor.tsx'
import { lazyImport } from './util/lazyImport.ts'

// Preload PGlite to avoid double compiling WASM
new PGlite('memory://temp', {})

import TestPgliteDbIvm from './database/pgliteDB/testPgliteDbIvm.tsx'
import TestPgliteDbQuery from './database/pgliteDB/testPgliteDbIvm.tsx'

const tests: Component<{ query: string; rowCount: number }>[] = [
  lazyImport(() => import('./database/tanstackDB/testTanstackDbIvm.tsx')),
  lazyImport(() => import('./database/duckDB/testDuckdbQuery.tsx')),
  lazyImport(() => import('./database/stoolapDB/testStoolapQuery.tsx')),
  lazyImport(() => import('./database/sqliteDB/testSqliteQuery.tsx')),
  lazyImport(() => import('./database/turso/testTursoDbQuery.tsx')),
  // Lazy loading causes WASM compilation issues
  TestPgliteDbIvm,
  TestPgliteDbQuery,
]

export default function SqlTest(props: { query: string; rowCount: number }) {
  return (
    <section class="grid">
      <UsageMonitor intervalMs={100}></UsageMonitor>

      <For each={tests}>
        {(Test) => (
          <Suspense>
            <Test query={props.query} rowCount={props.rowCount} />
          </Suspense>
        )}
      </For>
    </section>
  )
}
