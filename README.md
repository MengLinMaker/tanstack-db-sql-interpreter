# tanstack-db-sql-interpreter
Let app users write their own SQL for tanstack db queries.

### Why?
Imagine you had a data stream that you want to visualise and even query on.
The traditional approach of querying from a database will not perform for complex queries.

To improve performance, we need a database that supports incremental view maintenance (IVM):
- `Pglite live`
  - Additional complexity with OPFS, workers and headers.
  - Large WASM, around 3mb gzip.
- `Turso`
  - WASM import failed 2026-02-07.
  - Additional complexity with OPFS, workers and headers.
- `Tanstack db`
  - 4.27mb, I assume treeshakable.
 
`Tanstack db` would offer the least overhead and complexity as it is written in TypeScript.

However, app users cannot write SQL to create their own `Tanstack db` collections and queries. Therefore, an SQL interpreter is required for custom user created dashboards.
