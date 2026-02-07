# tanstack-db-sql-interpreter
Let app users write their own SQL for tanstack db queries.

## Why?
Imagine you had a data stream that you want to visualise and even query on.
The traditional approach of querying from a database will not perform for complex queries.

To improve performance, we need a database that supports incremental view maintenance (IVM):
- `Pglite live`
  - Additional complexity with OPFS, workers and headers
  - Large WASM, around 3mb gzip
- `Turso`
  - WASM import failed 2026-02-07.
  - Additional complexity with OPFS, workers and headers
- `Tanstack db`
  - 4.27mb, I assume treeshakable
 
`Tanstack db` would offer the least overhead and complexity as it is written in TypeScript.

However, app users cannot write SQL to create their own `Tanstack db` collections and queries. Therefore, an SQL interpreter is required for custom user created dashboards.

## Design considerations
### Core features

1. Parser grammar should not support destructive SQL - DELETE, ALTER
2. Parser should be reused for language server features:
    - Error correcting for auto suggestion.
    - Strict parsing for interpreting.
    - Incremental parsing if possible for longer SQL statements.
    - Parser should be written in TypeScript/JavaScript for smaller bundle sizes.
    - Parser candidates:
      - [lezer](https://lezer.codemirror.net/)
      - [Treesitter](https://tree-sitter.github.io/tree-sitter/) - compiles to WASM.
      - [Ohm](https://ohmjs.org/)
      - [Antlr4](https://github.com/antlr/antlr4)
      - [Chevrotain](https://github.com/Chevrotain/chevrotain)
3. Once parsed, each AST/CST node should either chain methods (of the tanstack db query builder) or apply a function (eq(), and()...).

_It may be easier to generate own parser from custom grammar._

### Additional features - if core features are done

1. Language server should integrate with open source browser based code editors:
    - Provides language support for tanstack db in IDEs like VSCode.
    - [CodeMirror](https://codemirror.net/)
2. Create eslint plugin for linting.
