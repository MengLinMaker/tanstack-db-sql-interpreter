import { createResource } from 'solid-js'
import { TestDuckdbQuery } from './database/duckDB/testDuckdbQuery.tsx'
import { TestPgliteDbIvm } from './database/pgliteDB/testPgliteDbIvm.tsx'
import { TestPgliteDbQuery } from './database/pgliteDB/testPgliteDbQuery.tsx'
import { SqliteDB, sqliteFactory } from './database/sqliteDB/sqliteDB.tsx'
import { SqliteSchemaMigrator } from './database/sqliteDB/sqliteSchemaMigrator.tsx'
import { TestSqliteQuery } from './database/sqliteDB/testSqliteQuery.tsx'
import { StoolapDB, stoolapFactory } from './database/stoolapDB/stoolapDB.tsx'
import { StoolapSchemaMigrator } from './database/stoolapDB/stoolapSchemaMigrator.tsx'
import { TestStoolapQuery } from './database/stoolapDB/testStoolapQuery.tsx'
import {
  TanstackDB,
  tanstackDbFactory,
} from './database/tanstackDB/tanstackDB.tsx'
import { TestTanstackDbIvm } from './database/tanstackDB/testTanstackDbIvm.tsx'
import { TestTursoDbQuery } from './database/turso/testTursoDbQuery.tsx'
import { TursoDB, tursoFactory } from './database/turso/tursoDB.tsx'
import { TursoSchemaMigrator } from './database/turso/tursoSchemaMigrator.tsx'
import { UsageMonitor } from './monitor/usageMonitor.tsx'

export default function SqlTest(props: { query: string; rowCount: number }) {
  const [tursoQueryDb] = createResource(tursoFactory)
  const [stoolapQueryDb] = createResource(stoolapFactory)

  return (
    <section class="grid">
      <UsageMonitor intervalMs={100}></UsageMonitor>

      <TanstackDB.Provider value={tanstackDbFactory()}>
        <TestTanstackDbIvm query={props.query} rowCount={props.rowCount} />
      </TanstackDB.Provider>

      <TestDuckdbQuery query={props.query} rowCount={props.rowCount} />

      <StoolapDB.Provider value={stoolapQueryDb.latest!}>
        <StoolapSchemaMigrator>
          <TestStoolapQuery query={props.query} rowCount={props.rowCount} />
        </StoolapSchemaMigrator>
      </StoolapDB.Provider>

      <SqliteDB.Provider value={sqliteFactory()}>
        <SqliteSchemaMigrator>
          <TestSqliteQuery query={props.query} rowCount={props.rowCount} />
        </SqliteSchemaMigrator>
      </SqliteDB.Provider>

      <TestPgliteDbIvm query={props.query} rowCount={props.rowCount} />

      <TestPgliteDbQuery query={props.query} rowCount={props.rowCount} />

      <TursoDB.Provider value={tursoQueryDb.latest!}>
        <TursoSchemaMigrator>
          <TestTursoDbQuery query={props.query} rowCount={props.rowCount} />
        </TursoSchemaMigrator>
      </TursoDB.Provider>
    </section>
  )
}
