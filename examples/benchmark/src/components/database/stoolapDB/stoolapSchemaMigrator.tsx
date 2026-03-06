import { createSignal, type JSX, onMount, Show, useContext } from 'solid-js'
import { sqlSchema } from '../util/schema/schema.sql.ts'
import { executeStoolap, executeStoolapBatch, StoolapDB } from './stoolapDB.tsx'

export function StoolapSchemaMigrator(props: { children: JSX.Element }) {
  const db = useContext(StoolapDB)
  const [ready, setReady] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)

  onMount(async () => {
    try {
      executeStoolapBatch(db, sqlSchema)
      const tables = executeStoolap(db, `SHOW TABLES;`)
      if (tables.type !== 'rows' || tables.rows.length === 0)
        throw new Error('Stoolap schema migration failed: no tables found')
      setReady(true)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e : new Error(String(e)))
    }
  })

  return (
    <Show
      when={ready()}
      fallback={
        <div class="turso-migrator-status">
          {error()
            ? `Stoolap migration failed: ${error()!.message}`
            : 'Preparing Stoolap schema…'}
        </div>
      }
    >
      {props.children}
    </Show>
  )
}
