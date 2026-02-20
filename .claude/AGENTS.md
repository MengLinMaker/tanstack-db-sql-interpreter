# Agent Coding Guidelines

This guide provides principles and patterns for AI agents contributing to the codebase.

## Scope
- Repository: `tanstack-db-sql-interpreter` monorepo managed by Nx + pnpm.
- Packages live under `packages/`.
- `packages/sql-parser` contains the SQL parser and AST/CST.
- `packages/tanstack-db-sql-interpreter` contains the interpreter for TanStack DB query builder.

## Setup
- Use `pnpm` (enforced via `preinstall`).
- Install: `pnpm i`
- Watch (format + lint + typecheck + unit tests + build in order): `pnpm watch`

## Build / Test / Lint
- Format: `pnpm format` (Biome, writes fixes)
- Lint: `pnpm lint` (Biome, writes fixes)
- Build: `pnpm build` (Nx filtered build)
- Graph: `pnpm graph`
- Knip: `pnpm knip`

## Nx Target Conventions
Targets are standardized across packages via `nx.json`:
- `test:lint` depends on `build` and uses `src/`, `test/`, and `biome.json`.
- `test:type` depends on `build` and uses `src/`, `test/`, `tsconfig.json`.
- `test:unit` depends on `build` and uses `src/`, `test/`, `vitest.config.ts`.
- `build` outputs to `dist/` and uses `src/`, `esbuild.ts` or `vite.config.ts`.

## Code and Structure Rules
- Place tests only in `test/`.
- Place source only in `src/`.
- Build output must go to `dist/`.
- Update `nx.json` only if you change inputs/outputs or add new targets.

## SQL Safety Constraints
- Parser should not support destructive SQL (no `DELETE`, `ALTER`).
- Parser should be reusable for strict parsing for interpreting.
- Parser should support error correction for auto-suggestion.
- Parser should support incremental parsing if possible.

## Agent Operating Expectations
- Prefer minimal, local changes that match existing patterns.
- Avoid introducing new dependencies unless necessary.
- Ensure changes have a clear test path (run unit tests or typecheck if relevant).
- If a change touches parser grammar or AST, verify no destructive SQL statements are accepted.
- If a change touches parser grammar or AST, verify interpreter chaining or function application remains consistent.

## When Unsure
- Ask for clarification on desired behavior or API shape.
- If a change affects public API, call it out explicitly in your response.
