import { createSignal, type JSX, onMount, Show, useContext } from 'solid-js'
import { sqlSchema } from '../../schema/schema.sql.ts'
import { SqlocalDB } from './sqlocalDB.tsx'

type SqlocalSchemaMigratorProps = {
  children: JSX.Element
}

const schemaStatements = sqlSchema
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean)

export function SqlocalSchemaMigrator(props: SqlocalSchemaMigratorProps) {
  const db = useContext(SqlocalDB)
  const [ready, setReady] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)

  onMount(async () => {
    try {
      console.log(await db.sql`SELECT 1`)
      await db.sql(sqlSchema)
      // await db.batch((sql) =>
      //   schemaStatements.map((statement) =>
      //     sql([statement] as unknown as TemplateStringsArray),
      //   ),
      // )
      const tables =
        await db.sql`SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;`
      console.log(tables)
      if (!tables.length) {
        throw Error(`SQLocal schema migration failed: no tables found`)
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
            ? `SQLocal migration failed: ${error()!.message}`
            : 'Preparing SQLocal schema…'}
        </div>
      }
    >
      {props.children}
    </Show>
  )
}
