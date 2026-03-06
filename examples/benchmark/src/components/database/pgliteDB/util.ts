import { PGlite } from '@electric-sql/pglite'
import { live, type PGliteWithLive } from '@electric-sql/pglite/live'
import { sqlSchema } from '../util/schema/schema.sql.ts'

export type PgliteDb = PGliteWithLive

export const pgliteFactory = async () => {
  const db = new PGlite('memory://', {
    extensions: {
      live,
    },
  }) as never as PgliteDb
  await db.exec(sqlSchema)
  const tables = await db.query(
    "select tablename from pg_tables where schemaname = 'public' order by tablename;",
  )
  if (tables.rows.length === 0)
    throw new Error('PGlite schema migration failed: no tables found')
  return db
}
