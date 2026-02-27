import { createSignal, type JSX, onMount, Show, useContext } from 'solid-js'
import { sqlSchema } from '../../schema/schema.sql.ts'
import { PgliteDB } from './pgliteDB.tsx'

type PgliteSchemaMigratorProps = {
  children: JSX.Element
}

export function PgliteSchemaMigrator(props: PgliteSchemaMigratorProps) {
  const db = useContext(PgliteDB)
  const [ready, setReady] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)

  onMount(async () => {
    try {
      await db.exec(sqlSchema)
      const tables = await db.query(
        "select tablename from pg_tables where schemaname = 'public' order by tablename;",
      )
      if (tables.rows.length === 0)
        throw new Error('PGlite schema migration failed: no tables found')
      setReady(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)))
    }
  })

  return (
    <Show
      when={ready()}
      fallback={
        <div class="pglite-migrator-status">
          {error()
            ? `PGlite migration failed: ${error()!.message}`
            : 'Preparing PGlite schema…'}
        </div>
      }
    >
      {props.children}
    </Show>
  )
}
