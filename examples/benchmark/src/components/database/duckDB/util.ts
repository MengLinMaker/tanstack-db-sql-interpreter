import { DuckDB, init } from '@ducklings/browser'
import { sqlSchema } from '../util/schema/schema.sql'

await init()
export const duckdbFactory = async () => {
  const db = new DuckDB()
  // Migrate
  const conn = await db.connect()
  await conn.query(sqlSchema)
  const tables = await conn.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'`,
  )
  await conn.close()
  if (!tables || tables.length === 0)
    throw Error(`DuckDB schema migration failed: no tables found`)
  return db
}
