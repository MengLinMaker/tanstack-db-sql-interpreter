import { createSignal, onCleanup, onMount, useContext } from 'solid-js'
import { sqlSchema } from '../../schema/schema.sql.ts'
import { generate, seed } from '../../util/dataGenerator.ts'
import { PgliteDB } from '../database/pgliteDB.tsx'

export function TestPgliteDB(props: { query: string }) {
  const db = useContext(PgliteDB)
  const [rows, setRows] = createSignal<Array<Record<string, unknown>>>([])
  const [status, setStatus] = createSignal('Initializing…')
  const [insertStatus, setInsertStatus] = createSignal('')

  onMount(async () => {
    try {
      await db.waitReady
      await db.exec(sqlSchema)

      const insertStart = performance.now()

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

      const homeRows = 1000
      for (let i = 0; i < homeRows; i++) {
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

      const insertDuration = performance.now() - insertStart
      setInsertStatus(
        `Inserted ${seed.home_feature_table.length + seed.locality_table.length + homeRows} rows in ${insertDuration.toFixed(1)} ms`,
      )

      const liveQuery = await db.live.query({
        query: props.query,
        callback: (results) => {
          setRows(results.rows)
          setStatus(`Live rows: ${results.rows.length}`)
        },
      })

      setRows(liveQuery.initialResults.rows)
      setStatus(`Live rows: ${liveQuery.initialResults.rows.length}`)

      const refreshTimer = window.setInterval(() => {
        void liveQuery.refresh()
      }, 1000)

      onCleanup(async () => {
        window.clearInterval(refreshTimer)
        await liveQuery.unsubscribe()
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setStatus(`Live query failed: ${message}`)
    }
  })

  return (
    <div>
      <p>{status()}</p>
      <p>{insertStatus()}</p>
      <pre>{JSON.stringify(rows(), null, 2)}</pre>
    </div>
  )
}
