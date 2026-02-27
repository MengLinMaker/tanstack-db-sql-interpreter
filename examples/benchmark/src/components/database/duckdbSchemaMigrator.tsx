import { createSignal, type JSX, onMount, Show, useContext } from 'solid-js'
import { sqlSchema } from '../../schema/schema.sql.ts'
import { DuckdbDB } from './duckdbDB.tsx'

type DuckdbSchemaMigratorProps = {
  children: JSX.Element
}

const schemaStatements = sqlSchema
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean)

export function DuckdbSchemaMigrator(props: DuckdbSchemaMigratorProps) {
  const db = useContext(DuckdbDB)
  const [ready, setReady] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)

  onMount(async () => {
    try {
      const conn = await db.connect()
      for (const statement of schemaStatements) {
        await conn.query(statement)
      }
      const tables = await conn.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'`,
      )
      await conn.close()
      if (!tables || (tables as { length: number }).length === 0) {
        throw Error(`DuckDB schema migration failed: no tables found`)
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
            ? `DuckDB migration failed: ${error()!.message}`
            : 'Preparing DuckDB schema…'}
        </div>
      }
    >
      {props.children}
    </Show>
  )
}
