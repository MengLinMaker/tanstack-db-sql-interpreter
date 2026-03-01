import { createResource } from 'solid-js'
import { DuckdbDB, duckdbFactory } from './database/duckdbDB.tsx'
import { DuckdbSchemaMigrator } from './database/duckdbSchemaMigrator.tsx'
import { PgliteDB, pgliteFactory } from './database/pgliteDB.tsx'
import { PgliteSchemaMigrator } from './database/pgliteSchemaMigrator.tsx'
import { SqliteDB, sqliteFactory } from './database/sqliteDB.tsx'
import { SqliteSchemaMigrator } from './database/sqliteSchemaMigrator.tsx'
import { StoolapDB, stoolapFactory } from './database/stoolapDB.tsx'
import { StoolapSchemaMigrator } from './database/stoolapSchemaMigrator.tsx'
import { TanstackDB, tanstackDbFactory } from './database/tanstackDB.tsx'
import { TursoDB, tursoFactory } from './database/tursoDB.tsx'
import { TursoSchemaMigrator } from './database/tursoSchemaMigrator.tsx'
import { TestDuckdbQuery } from './test/testDuckdbQuery.tsx'
import { TestPgliteDbIvm } from './test/testPgliteDbIvm.tsx'
import { TestPgliteDbQuery } from './test/testPgliteDbQuery.tsx'
import { TestSqliteQuery } from './test/testSqliteQuery.tsx'
import { TestStoolapQuery } from './test/testStoolapQuery.tsx'
import { TestTanstackDbIvm } from './test/testTanstackDbIvm.tsx'
import { TestTursoDbQuery } from './test/testTursoDbQuery.tsx'
import { UsageMonitor } from './usageMonitor.tsx'

export default function SqlTest(props: { query: string; rowCount: number }) {
  const [tursoQueryDb] = createResource(tursoFactory)
  const [duckdbQueryDb] = createResource(duckdbFactory)
  const [stoolapQueryDb] = createResource(stoolapFactory)

  return (
    <section class="grid">
      <article>
        <UsageMonitor intervalMs={100}></UsageMonitor>
      </article>

      <article>
        <TanstackDB.Provider value={tanstackDbFactory()}>
          <TestTanstackDbIvm query={props.query} rowCount={props.rowCount} />
        </TanstackDB.Provider>
      </article>

      <article>
        <DuckdbDB.Provider value={duckdbQueryDb.latest!}>
          <DuckdbSchemaMigrator>
            <TestDuckdbQuery query={props.query} rowCount={props.rowCount} />
          </DuckdbSchemaMigrator>
        </DuckdbDB.Provider>
      </article>

      <article>
        <StoolapDB.Provider value={stoolapQueryDb.latest!}>
          <StoolapSchemaMigrator>
            <TestStoolapQuery query={props.query} rowCount={props.rowCount} />
          </StoolapSchemaMigrator>
        </StoolapDB.Provider>
      </article>

      <article>
        <SqliteDB.Provider value={sqliteFactory()}>
          <SqliteSchemaMigrator>
            <TestSqliteQuery query={props.query} rowCount={props.rowCount} />
          </SqliteSchemaMigrator>
        </SqliteDB.Provider>
      </article>

      <article>
        <PgliteDB.Provider value={pgliteFactory()}>
          <PgliteSchemaMigrator>
            <TestPgliteDbIvm query={props.query} rowCount={props.rowCount} />
          </PgliteSchemaMigrator>
        </PgliteDB.Provider>
      </article>

      <article>
        <PgliteDB.Provider value={pgliteFactory()}>
          <PgliteSchemaMigrator>
            <TestPgliteDbQuery query={props.query} rowCount={props.rowCount} />
          </PgliteSchemaMigrator>
        </PgliteDB.Provider>
      </article>

      <article>
        <TursoDB.Provider value={tursoQueryDb.latest!}>
          <TursoSchemaMigrator>
            <TestTursoDbQuery query={props.query} rowCount={props.rowCount} />
          </TursoSchemaMigrator>
        </TursoDB.Provider>
      </article>
    </section>
  )
}
