import { createSignal, type JSX, onMount, Show, useContext } from 'solid-js'
import { sqlSchema } from '../schema/schema.sql.ts'
import { TursoDB } from './tursoDB.tsx'

type TursoSchemaMigratorProps = {
  children: JSX.Element
}

export function TursoSchemaMigrator(props: TursoSchemaMigratorProps) {
  const db = useContext(TursoDB)
  const [ready, setReady] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)

  onMount(async () => {
    try {
      await db.exec(sqlSchema)
      const tables = await db
        .prepare(
          `SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;`,
        )
        .all()
      if (tables.length === 0)
        throw Error(`Turso schema migration failed: no tables found`)
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
            ? `Turso migration failed: ${error()!.message}`
            : 'Preparing Turso schema…'}
        </div>
      }
    >
      {props.children}
    </Show>
  )
}
