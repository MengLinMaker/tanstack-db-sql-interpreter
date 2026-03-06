import { connect } from '@tursodatabase/database-wasm/vite'
import { sqlSchema } from '../util/schema/schema.sql.ts'

export type TursoDb = Awaited<ReturnType<typeof connect>>

export const tursoFactory = async (): Promise<TursoDb> => {
  const db = await connect(`:memory:`, {
    timeout: 1000,
    // experimental: ['views'],
  })
  await db.exec(sqlSchema)
  const tables = await db
    .prepare(`SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name;`)
    .all()
  if (tables.length === 0)
    throw new Error('Turso schema migration failed: no tables found')
  return db
}
