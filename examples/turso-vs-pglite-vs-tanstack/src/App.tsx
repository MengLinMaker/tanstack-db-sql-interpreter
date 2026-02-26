import { PgliteDB } from './components/pgliteDB.tsx'
import { PgliteSchemaMigrator } from './components/pgliteSchemaMigrator.tsx'
import { TanstackDB } from './components/tanstackDB.tsx'
import { TursoDB } from './components/tursoDB.tsx'
import { TursoSchemaMigrator } from './components/tursoSchemaMigrator.tsx'
import { UsageMonitor } from './components/usageMonitor.tsx'

export default function App() {
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
