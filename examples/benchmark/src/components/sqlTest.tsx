import { TestDuckdbQuery } from './database/duckDB/testDuckdbQuery.tsx'
import { TestPgliteDbIvm } from './database/pgliteDB/testPgliteDbIvm.tsx'
import { TestPgliteDbQuery } from './database/pgliteDB/testPgliteDbQuery.tsx'
import { TestSqliteQuery } from './database/sqliteDB/testSqliteQuery.tsx'
import { TestStoolapQuery } from './database/stoolapDB/testStoolapQuery.tsx'
import { TestTanstackDbIvm } from './database/tanstackDB/testTanstackDbIvm.tsx'
import { TestTursoDbQuery } from './database/turso/testTursoDbQuery.tsx'
import { UsageMonitor } from './monitor/usageMonitor.tsx'

export default function SqlTest(props: { query: string; rowCount: number }) {
  return (
    <section class="grid">
      <UsageMonitor intervalMs={100}></UsageMonitor>

      <TestTanstackDbIvm query={props.query} rowCount={props.rowCount} />

      <TestDuckdbQuery query={props.query} rowCount={props.rowCount} />

      <TestStoolapQuery query={props.query} rowCount={props.rowCount} />

      <TestSqliteQuery query={props.query} rowCount={props.rowCount} />

      <TestPgliteDbIvm query={props.query} rowCount={props.rowCount} />

      <TestPgliteDbQuery query={props.query} rowCount={props.rowCount} />

      <TestTursoDbQuery query={props.query} rowCount={props.rowCount} />
    </section>
  )
}
