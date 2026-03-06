import type { InitOutput } from '../../../assets/wasm/stoolap.js'
import { sqlSchema } from '../util/schema/schema.sql.ts'

export type StoolapExecuteRows = {
  type: 'rows'
  columns: string[]
  rows: unknown[][]
  count?: number
}

export type StoolapExecuteAffected = {
  type: 'affected'
  affected: number
}

export type StoolapExecuteError = {
  type: 'error'
  message: string
}

export type StoolapExecuteResult =
  | StoolapExecuteRows
  | StoolapExecuteAffected
  | StoolapExecuteError

export type StoolapDatabase = {
  execute: (sql: string) => string
  execute_batch: (sql: string) => string
  version: () => string
  free?: () => void
}

let initPromise: Promise<InitOutput> | null = null

export const parseStoolapResult = (raw: string): StoolapExecuteResult => {
  return JSON.parse(raw) as StoolapExecuteResult
}

export const executeStoolap = (
  db: StoolapDatabase,
  sql: string,
): StoolapExecuteResult => {
  const result = parseStoolapResult(db.execute(sql))
  if (result.type === 'error') {
    throw new Error(result.message)
  }
  return result
}

export const executeStoolapBatch = (
  db: StoolapDatabase,
  sql: string,
): StoolapExecuteResult => {
  const result = parseStoolapResult(db.execute_batch(sql))
  if (result.type === 'error') {
    throw new Error(result.message)
  }
  return result
}

export const stoolapFactory = async (): Promise<StoolapDatabase> => {
  const wasm = await import('../../../assets/wasm/stoolap.js')
  if (!initPromise) {
    initPromise = wasm.default()
  }
  await initPromise
  const db = new wasm.StoolapDB() as StoolapDatabase
  executeStoolapBatch(db, sqlSchema)
  const tables = executeStoolap(db, `SHOW TABLES;`)
  if (tables.type !== 'rows' || tables.rows.length === 0)
    throw new Error('Stoolap schema migration failed: no tables found')
  return db
}
