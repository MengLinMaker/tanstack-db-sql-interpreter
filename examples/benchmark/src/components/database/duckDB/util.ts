import { DuckDB, init } from '@ducklings/browser'
// @ts-expect-error <url>
import wasmJsUrl from '@ducklings/browser/wasm/duckdb.js?url'
// @ts-expect-error <url>
import wasmUrl from '@ducklings/browser/wasm/duckdb.wasm?url'
// @ts-expect-error <url>
import workerUrl from '@ducklings/browser/worker?url'
import { sqlSchema } from '../util/schema/schema.sql'

await init({ wasmUrl, wasmJsUrl, workerUrl })
export const duckdbFactory = async () => {
  const db = new DuckDB()
  // Migrate
  const conn = await db.connect()
  await conn.query(sqlSchema)
  const tables = await conn.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'`,
  )
  await conn.close()
  if (!tables || tables['numRows'] === 0)
    throw Error(`DuckDB schema migration failed: no tables found`)
  return db
}
