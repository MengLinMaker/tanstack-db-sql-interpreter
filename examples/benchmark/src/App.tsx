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
  1 as id,
  COUNT(*) AS count_home,
  MIN(h.higher_price_aud) AS min_price,
  AVG(h.higher_price_aud) AS avg_price,
  MAX(h.higher_price_aud) AS max_price
FROM home_table h`,

  'select home data': `SELECT
  h.id,
  h.higher_price_aud,
  hf.bed_quantity,
  hf.bath_quantity,
  hf.car_quantity,
  h.street_address,
  lf.suburb_name,
  lf.state_abbreviation,
  lf.postcode
FROM home_table h
JOIN locality_table lf ON lf.id = h.locality_table_id
JOIN home_feature_table hf ON hf.id = h.home_feature_table_id
ORDER BY h.higher_price_aud DESC`,

  'group by state': `SELECT
  state_abbreviation AS id,
  state_abbreviation,
  AVG(hf.bed_quantity) AS avg_beds,
  AVG(hf.bath_quantity) AS avg_baths,
  AVG(hf.car_quantity) AS avg_cars,
  COUNT(h.id) AS home_count
FROM home_table h
JOIN locality_table lf ON lf.id = h.locality_table_id
JOIN home_feature_table hf ON hf.id = h.home_feature_table_id
GROUP BY state_abbreviation
ORDER BY home_count DESC`,
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
