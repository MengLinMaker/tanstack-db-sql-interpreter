import { AsyncDuckDB, ConsoleLogger, selectBundle } from '@akabana/duckdb-wasm'
// @ts-expect-error <no type>
import eh_worker from '@akabana/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'
// @ts-expect-error <no type>
import duckdb_wasm_eh from '@akabana/duckdb-wasm/dist/duckdb-eh.wasm?url'
import { sqlSchema } from '../util/schema/schema.sql'

export const duckdbFactory = async () => {
  const bundle = await selectBundle({
    eh: {
      mainModule: duckdb_wasm_eh,
      mainWorker: eh_worker,
    },
  } as never)
  const worker = new Worker(bundle.mainWorker!)
  const logger = new ConsoleLogger()
  const db = new AsyncDuckDB(logger, worker)
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
  // Migrate
  const conn = await db.connect()
  await conn.query(sqlSchema)
  const tables = await conn.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'`,
  )
  await conn.close()
  if (!tables || tables.numRows === 0)
    throw Error(`DuckDB schema migration failed: no tables found`)
  return db
}
