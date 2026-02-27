import { createSignal, type JSX, onMount, Show, useContext } from 'solid-js'
import { sqlSchema } from '../../schema/schema.sql.ts'
import { SqliteDB } from './sqliteDB.tsx'

type SqliteSchemaMigratorProps = {
  children: JSX.Element
}

export function SqliteSchemaMigrator(props: SqliteSchemaMigratorProps) {
  const db = useContext(SqliteDB)
  const [ready, setReady] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)

  onMount(async () => {
    try {
      await db.sql(sqlSchema)
      const tables =
        await db.sql`SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;`
      if (!tables.length) {
        throw Error(`SQLite schema migration failed: no tables found`)
      }
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
            ? `SQLite migration failed: ${error()!.message}`
            : 'Preparing SQLite schema…'}
        </div>
      }
    >
      {props.children}
    </Show>
  )
}
