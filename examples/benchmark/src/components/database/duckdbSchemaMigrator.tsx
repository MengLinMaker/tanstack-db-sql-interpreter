import { createSignal, type JSX, onMount, Show, useContext } from 'solid-js'
import { sqlSchema } from '../../schema/schema.sql.ts'
import { DuckdbDB } from './duckdbDB.tsx'

export function DuckdbSchemaMigrator(props: { children: JSX.Element }) {
  const db = useContext(DuckdbDB)
  const [ready, setReady] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)

  onMount(async () => {
    try {
      const conn = await db.connect()
      await conn.query(sqlSchema)
      const tables = await conn.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'`,
      )
      await conn.close()
      if (!tables || tables.numRows === 0)
        throw Error(`DuckDB schema migration failed: no tables found`)
      setReady(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)))
    }
  })

  return (
    <Show
      when={ready()}
      fallback={
        <div class="turso-migrator-status">
          {error()
            ? `DuckDB migration failed: ${error()!.message}`
            : 'Preparing DuckDB schema…'}
        </div>
      }
    >
      {props.children}
    </Show>
  )
}
