import { createSignal } from 'solid-js'
import { PgliteDB } from './components/database/pgliteDB.tsx'
import { PgliteSchemaMigrator } from './components/database/pgliteSchemaMigrator.tsx'
import { TanstackDB } from './components/database/tanstackDB.tsx'
import { TursoDB } from './components/database/tursoDB.tsx'
import { TursoSchemaMigrator } from './components/database/tursoSchemaMigrator.tsx'
import { SqlTextInput } from './components/sqlTextInput.tsx'
import { TestPgliteDB } from './components/test/TestPgliteDB.tsx'
import { UsageMonitor } from './components/usageMonitor.tsx'

const sqlExamples = {
  'count all': `SELECT
  COUNT(*) AS count_home,
  MIN(h.higher_price_aud) AS min_price,
  AVG(h.higher_price_aud) AS avg_price,
  MAX(h.higher_price_aud) AS max_price
FROM home_table h`,

  'join overview': `SELECT
  h.id,
  h.street_address,
  lf.suburb_name,
  hf.bed_quantity,
  hf.bath_quantity,
  hf.car_quantity,
  h.higher_price_aud
FROM home_table h
JOIN locality_table lf ON lf.id = h.locality_table_id
JOIN home_feature_table hf ON hf.id = h.home_feature_table_id
ORDER BY h.higher_price_aud DESC
LIMIT 20`,

  'price band': `SELECT
  CASE
    WHEN h.higher_price_aud < 500000 THEN 'under_500k'
    WHEN h.higher_price_aud < 1000000 THEN '500k_1m'
    WHEN h.higher_price_aud < 2000000 THEN '1m_2m'
    ELSE 'over_2m'
  END AS price_band,
  COUNT(*) AS homes
FROM home_table h
GROUP BY price_band
ORDER BY homes DESC`,
}

export default function App() {
  const [sql, setSql] = createSignal(Object.values(sqlExamples)[0]!)
  const [rowCount, setRowCount] = createSignal(1000)

  return (
    <div class="page">
      <section>
        <h1>Browser IVM benchmark</h1>
      </section>

      <section>
        <UsageMonitor intervalMs={100}></UsageMonitor>
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
          {Object.entries(sqlExamples).map(([label, query]) => (
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
      </section>

      <section class="grid">
        <article>
          <PgliteDB.Provider value={PgliteDB.defaultValue}>
            <PgliteSchemaMigrator>
              <TestPgliteDB query={sql()} rowCount={rowCount()} />
            </PgliteSchemaMigrator>
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
