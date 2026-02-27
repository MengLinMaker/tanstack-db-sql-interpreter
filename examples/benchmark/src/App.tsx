import { createSignal, lazy } from 'solid-js'
import { queries } from './schema/queries.ts'
import { clearOpfs } from './util/clearOpfs.ts'

const SqlTextInput = lazy(() => import('./components/sqlTextInput.tsx'))
const SqlTest = lazy(() => import('./components/sqlTest.tsx'))

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

      <SqlTest query={sql()} rowCount={rowCount()} />
    </div>
  )
}
