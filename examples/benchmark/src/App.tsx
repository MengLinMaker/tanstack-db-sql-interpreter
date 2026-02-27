import { createResource, createSignal } from 'solid-js'
import { PgliteDB, pgliteFactory } from './components/database/pgliteDB.tsx'
import { PgliteSchemaMigrator } from './components/database/pgliteSchemaMigrator.tsx'
import { SqliteDB, sqliteFactory } from './components/database/sqliteDB.tsx'
import { SqliteSchemaMigrator } from './components/database/sqliteSchemaMigrator.tsx'
import {
  TanstackDB,
  tanstackDbFactory,
} from './components/database/tanstackDB.tsx'
import { TursoDB, tursoFactory } from './components/database/tursoDB.tsx'
import { TursoSchemaMigrator } from './components/database/tursoSchemaMigrator.tsx'
import { SqlTextInput } from './components/sqlTextInput.tsx'
import { TestPgliteDbIvm } from './components/test/testPgliteDbIvm.tsx'
import { TestPgliteDbQuery } from './components/test/testPgliteDbQuery.tsx'
import { TestSqliteQuery } from './components/test/testSqliteQuery.tsx'
import { TestTanstackDbIvm } from './components/test/testTanstackDbIvm.tsx'
import { TestTursoDbQuery } from './components/test/testTursoDbQuery.tsx'
import { UsageMonitor } from './components/usageMonitor.tsx'
import { queries } from './schema/queries.ts'
import { clearOpfs } from './util/clearOpfs.ts'

export default function App() {
  const defaultSql = Object.values(queries)[0]!
  const defaultRowCount = 10000
  const [sql, setSql] = createSignal(defaultSql)
  const [rowCount, setRowCount] = createSignal(defaultRowCount)

  const resetTestConfig = async () => {
    setSql(defaultSql)
    setRowCount(defaultRowCount)
    await clearOpfs()
  }

  const [tursoQueryDb] = createResource(tursoFactory)

  return (
    <div class="page">
      <section>
        <h1>Browser IVM benchmark</h1>
      </section>

      <section class="card">
        <h2>Test configuration</h2>
        <p class="example-label">Select an example to load into the editor:</p>
        <label class="example-label">
          Row count
          <input
            class="row-count-input"
            type="text"
            inputmode="numeric"
            value={rowCount()}
            onInput={(event) => {
              const next = Number.parseInt(event.currentTarget.value, 10)
              if (Number.isNaN(next) || next < 0) return
              setRowCount(next)
            }}
          />
        </label>
        <div class="actions">
          {Object.entries(queries).map(([label, query]) => (
            <button
              class="ghost example-button"
              type="button"
              onClick={() => setSql(query)}
            >
              {label}
            </button>
          ))}
        </div>
        <SqlTextInput value={sql()} onChange={setSql} />
        <button
          class="ghost example-button"
          type="button"
          onClick={resetTestConfig}
        >
          Reset config and clear OPFS
        </button>
      </section>

      <section class="grid">
        <article>
          <UsageMonitor intervalMs={100}></UsageMonitor>
        </article>

        <article>
          <TanstackDB.Provider value={tanstackDbFactory()}>
            <TestTanstackDbIvm query={sql()} rowCount={rowCount()} />
          </TanstackDB.Provider>
        </article>

        <article>
          <PgliteDB.Provider value={pgliteFactory()}>
            <PgliteSchemaMigrator>
              <TestPgliteDbIvm query={sql()} rowCount={rowCount()} />
            </PgliteSchemaMigrator>
          </PgliteDB.Provider>
        </article>

        <article>
          <PgliteDB.Provider value={pgliteFactory()}>
            <PgliteSchemaMigrator>
              <TestPgliteDbQuery query={sql()} rowCount={rowCount()} />
            </PgliteSchemaMigrator>
          </PgliteDB.Provider>
        </article>

        <article>
          <TursoDB.Provider value={tursoQueryDb.latest!}>
            <TursoSchemaMigrator>
              <TestTursoDbQuery query={sql()} rowCount={rowCount()} />
            </TursoSchemaMigrator>
          </TursoDB.Provider>
        </article>

        <article>
          <SqliteDB.Provider value={sqliteFactory()}>
            <SqliteSchemaMigrator>
              <TestSqliteQuery query={sql()} rowCount={rowCount()} />
            </SqliteSchemaMigrator>
          </SqliteDB.Provider>
        </article>
      </section>
    </div>
  )
}
