import {
  AsyncDuckDB,
  ConsoleLogger,
  type DuckDBBundles,
  selectBundle,
} from '@duckdb/duckdb-wasm'
// @ts-expect-error <no type>
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'
// @ts-expect-error <no type>
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'
// @ts-expect-error <no type>
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'
// @ts-expect-error <no type>
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'
import { sqlSchema } from '../util/schema/schema.sql'

const MANUAL_BUNDLES: DuckDBBundles = {
  mvp: {
    mainModule: duckdb_wasm,
    mainWorker: mvp_worker,
  },
  eh: {
    mainModule: duckdb_wasm_eh,
    mainWorker: eh_worker,
  },
}

export const duckdbFactory = async () => {
  const bundle = await selectBundle(MANUAL_BUNDLES)
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
