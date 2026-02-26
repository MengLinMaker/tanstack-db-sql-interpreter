import { createSignal } from 'solid-js'
import { PgliteDB } from './components/pgliteDB.tsx'
import { PgliteSchemaMigrator } from './components/pgliteSchemaMigrator.tsx'
import { SqlTextInput } from './components/sqlTextInput.tsx'
import { TanstackDB } from './components/tanstackDB.tsx'
import { TursoDB } from './components/tursoDB.tsx'
import { TursoSchemaMigrator } from './components/tursoSchemaMigrator.tsx'
import { UsageMonitor } from './components/usageMonitor.tsx'

const sqlExamples = {
  'count all': `SELECT
  COUNT(*) AS count_home,
  MIN(h.higher_price_aud) AS min_price,
  AVG(h.higher_price_aud) AS avg_price,
  MAX(h.higher_price_aud) AS max_price
FROM home_table h`,
}

export default function App() {
  const [sql, setSql] = createSignal(Object.values(sqlExamples)[0]!)

  return (
    <div class="page">
      <section>
        <h1>Browser IVM benchmark</h1>
      </section>

      {/* <div class="actions">
          <button class="primary">Start a comparison</button>
          <button class="ghost">Load sample data</button>
        </div> */}

      <section>
        <UsageMonitor intervalMs={100}></UsageMonitor>
      </section>

      <section class="card">
        <h2>View SQL</h2>
        <SqlTextInput value={sql()} onChange={setSql} />
      </section>

      <section class="grid">
        <article class="card">
          <h2>Pglite</h2>
          <p class="subtitle">Single thread Postgres in WASM</p>
          <PgliteDB.Provider value={PgliteDB.defaultValue}>
            <PgliteSchemaMigrator>hello</PgliteSchemaMigrator>
          </PgliteDB.Provider>
        </article>

        <article class="card">
          <h2>Turso</h2>
          <p class="subtitle">SQLite rust rewrite in WASM</p>
          <TursoDB.Provider value={TursoDB.defaultValue}>
            <TursoSchemaMigrator>hello</TursoSchemaMigrator>
          </TursoDB.Provider>
        </article>

        <article class="card">
          <h2>Tanstack db</h2>
          <p class="subtitle">TypeScipt database kit</p>
          <TanstackDB.Provider value={TanstackDB.defaultValue}>
            hello
          </TanstackDB.Provider>
        </article>
      </section>
    </div>
  )
}
