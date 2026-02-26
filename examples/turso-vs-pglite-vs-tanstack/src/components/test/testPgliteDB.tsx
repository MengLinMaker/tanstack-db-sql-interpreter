import { createEffect, onCleanup, onMount, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { sqlSchema } from '../../schema/schema.sql.ts'
import { generate, seed } from '../../util/dataGenerator.ts'
import { PgliteDB } from '../database/pgliteDB.tsx'

const seedTestData = async (db: typeof PgliteDB.defaultValue) => {
  for (const row of seed.home_feature_table) {
    await db.query(
      `INSERT INTO home_feature_table (id, bed_quantity, bath_quantity, car_quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [row.id, row.bed_quantity, row.bath_quantity, row.car_quantity],
    )
  }
  for (const row of seed.locality_table) {
    await db.query(
      `INSERT INTO locality_table (id, suburb_name, postcode, state_abbreviation)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [row.id, row.suburb_name, row.postcode, row.state_abbreviation],
    )
  }
}
const insertTestData = async (db: typeof PgliteDB.defaultValue) => {
  const row = generate.home_table()
  await db.query(
    `INSERT INTO home_table (
             id,
             locality_table_id,
             home_feature_table_id,
             street_address,
             higher_price_aud
           )
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
    [
      row.id,
      row.locality_table_id,
      row.home_feature_table_id,
      row.street_address,
      row.higher_price_aud,
    ],
  )
}

export function TestPgliteDB(props: { query: string; rowCount: number }) {
  const db = useContext(PgliteDB)
  const [state, setState] = createStore({
    insertStatus: '',
    seedStatus: '',
    errorStatus: '',
    isRunning: false,
    testStatus: '',
    isFinished: false,
    queryStatus: '',
  })
  const tableRows = () => [
    {
      label: 'Status',
      value: state.errorStatus
        ? `Test failed: ${state.errorStatus}`
        : state.testStatus || 'Idle',
    },
    { label: 'Query time', value: state.queryStatus || '—' },
    { label: 'Seed time', value: state.seedStatus || '—' },
    { label: 'Insert time', value: state.insertStatus || '—' },
  ]

  let refreshTimer: number | undefined
  let unsubscribeLive: (() => Promise<void>) | undefined

  const clearLive = async () => {
    if (refreshTimer !== undefined) {
      window.clearInterval(refreshTimer)
      refreshTimer = undefined
    }
    if (unsubscribeLive) {
      await unsubscribeLive()
      unsubscribeLive = undefined
    }
  }

  const runTest = async () => {
    setState({
      isRunning: true,
      isFinished: false,
      errorStatus: '',
      testStatus: 'Test running…',
      seedStatus: '',
      insertStatus: '',
      queryStatus: '',
    })

    try {
      await clearLive()

      await db.waitReady
      await db.exec(sqlSchema)

      const seedStart = performance.now()
      await seedTestData(db)
      const seedDuration = performance.now() - seedStart
      setState({ seedStatus: `${seedDuration.toFixed(1)} ms` })

      const insertStart = performance.now()
      const homeRows = props.rowCount
      for (let i = 0; i < homeRows; i++) {
        await insertTestData(db)
      }

      const insertDuration = performance.now() - insertStart
      setState({ insertStatus: `${insertDuration.toFixed(1)} ms` })

      const liveQuery = await db.live.query({
        query: props.query,
        callback: () => {}, // Results are intentionally not rendered to avoid UI blocking.
      })

      refreshTimer = window.setInterval(() => {
        const startedAt = performance.now()
        void liveQuery.refresh().then(() => {
          const duration = performance.now() - startedAt
          setState({ queryStatus: `Last query: ${duration.toFixed(1)} ms` })
        })
      }, 100)

      unsubscribeLive = () => liveQuery.unsubscribe()
      setState({
        testStatus: 'Test finished',
        isFinished: true,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setState({
        errorStatus: message,
        testStatus: 'Test failed',
      })
    } finally {
      setState({
        isRunning: false,
      })
    }
  }

  onMount(async () => {
    try {
      onCleanup(async () => {
        await clearLive()
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setState({
        errorStatus: message,
      })
    }
  })

  createEffect(() => {
    props.query
    props.rowCount
    void clearLive()
    setState({
      insertStatus: '',
      seedStatus: '',
      errorStatus: '',
      isRunning: false,
      testStatus: '',
      isFinished: false,
      queryStatus: '',
    })
  })

  return (
    <div class="test">
      <h2>Pglite</h2>
      <p class="subtitle">Single thread Postgres in WASM</p>
      {!state.isRunning && !state.isFinished ? (
        <button type="button" onClick={() => void runTest()}>
          Start test
        </button>
      ) : null}
      <table>
        <tbody>
          {tableRows().map((row) => (
            <tr>
              <td>{row.label}</td>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
