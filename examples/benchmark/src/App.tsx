import { createSignal, onMount } from 'solid-js'
import { PgliteDB } from './components/database/pgliteDB.tsx'
import { PgliteSchemaMigrator } from './components/database/pgliteSchemaMigrator.tsx'
import { TanstackDB } from './components/database/tanstackDB.tsx'
import { TursoDB } from './components/database/tursoDB.tsx'
import { TursoSchemaMigrator } from './components/database/tursoSchemaMigrator.tsx'
import { SqlTextInput } from './components/sqlTextInput.tsx'
import { TestPgliteDbIvm } from './components/test/testPgliteDbIvm.tsx'
import { TestPgliteDbQuery } from './components/test/testPgliteDbQuery.tsx'
import { TestTanstackDbIvm } from './components/test/testTanstackDbIvm.tsx'
import { TestTursoDbQuery } from './components/test/testTursoDbQuery.tsx'
import { UsageMonitor } from './components/usageMonitor.tsx'

const sqlExamples = {
  'select home_table': `SELECT home_table.*
FROM home_table`,

  'aggregate home_table': `SELECT
  COUNT(*) AS count_home,
  MIN(h.higher_price_aud) AS min_price,
  AVG(h.higher_price_aud) AS avg_price,
  MAX(h.higher_price_aud) AS max_price
FROM home_table h`,

  join: `SELECT
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
ORDER BY h.higher_price_aud DESC`,

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
  const defaultSql = Object.values(sqlExamples)[0]!
  const defaultRowCount = 10000
  const [sql, setSql] = createSignal(defaultSql)
  const [rowCount, setRowCount] = createSignal(defaultRowCount)

  const clearOpfs = async () => {
    if (!('storage' in navigator) || !navigator.storage.getDirectory) {
      return
    }
    try {
      // @ts-expect-error <not defined>
      await (await navigator.storage.getDirectory()).remove({ recursive: true })
    } catch (e) {
      console.error(e)
    }
  }

  onMount(async () => {
    await clearOpfs()
  })

  const resetTestConfig = async () => {
    setSql(defaultSql)
    setRowCount(defaultRowCount)
    await clearOpfs()
  }

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
          <TanstackDB.Provider value={TanstackDB.defaultValue}>
            <TestTanstackDbIvm query={sql()} rowCount={rowCount()} />
          </TanstackDB.Provider>
        </article>

        <article>
          <PgliteDB.Provider value={PgliteDB.defaultValue}>
            <PgliteSchemaMigrator>
              <TestPgliteDbIvm query={sql()} rowCount={rowCount()} />
            </PgliteSchemaMigrator>
          </PgliteDB.Provider>
        </article>

        <article>
          <PgliteDB.Provider value={PgliteDB.defaultValue}>
            <PgliteSchemaMigrator>
              <TestPgliteDbQuery query={sql()} rowCount={rowCount()} />
            </PgliteSchemaMigrator>
          </PgliteDB.Provider>
        </article>

        <article>
          <TursoDB.Provider value={TursoDB.defaultValue}>
            <TursoSchemaMigrator>
              <TestTursoDbQuery query={sql()} rowCount={rowCount()} />
            </TursoSchemaMigrator>
          </TursoDB.Provider>
        </article>
      </section>
    </div>
  )
}
