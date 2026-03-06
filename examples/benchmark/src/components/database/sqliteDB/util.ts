import { SQLocal } from 'sqlocal'
import { sqlSchema } from '../util/schema/schema.sql.ts'

export type SqliteDb = SQLocal

export const sqliteFactory = async (): Promise<SqliteDb> => {
  const db = new SQLocal(':memory:')
  await db.sql(sqlSchema)
  const tables =
    await db.sql`SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;`
  if (!tables.length) {
    throw new Error('SQLite schema migration failed: no tables found')
  }
  return db
}
