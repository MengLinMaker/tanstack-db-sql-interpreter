import { createSignal, lazy, onMount } from 'solid-js'
import { effect } from 'solid-js/web'
import { generate, seed } from './components/database/util/dataGenerator.ts'
import { queries } from './components/database/util/queries.ts'
import { clearOpfs } from './util/clearOpfs.ts'

const SqlTextInput = lazy(() => import('./components/sqlTextInput.tsx'))
const SqlTest = lazy(() => import('./components/sqlTest.tsx'))

const home_tables: ReturnType<typeof generate.home_table>[] = []
const defaultSql = Object.values(queries)[0]!
const defaultRowCount = 10000

export default function App() {
  const [sql, setSql] = createSignal(defaultSql)
  const [rowCount, setRowCount] = createSignal(defaultRowCount)
  const [seed_home_table, set_seed_home_table] = createSignal<
    ReturnType<typeof generate.home_table>[]
  >([])
  onMount(() => {
    for (let i = 0; i < defaultRowCount; i++)
      home_tables.push(generate.home_table())
    set_seed_home_table(home_tables)
  })

  effect(() => {
    if (rowCount() > home_tables.length)
      for (let i = home_tables.length; i < rowCount(); i++)
        home_tables.push(generate.home_table())
    set_seed_home_table(home_tables.slice(0, rowCount()))
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

      <SqlTest
        query={sql()}
        rowCount={rowCount()}
        seed={{
          home_feature_table: seed.home_feature_table,
          locality_table: seed.locality_table,
          home_table: seed_home_table(),
        }}
      />
    </div>
  )
}
