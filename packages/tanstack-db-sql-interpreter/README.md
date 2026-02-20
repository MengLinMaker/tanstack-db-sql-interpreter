# @menglinmaker/tanstack-db-sql-interpreter
Interprets SQL for Tanstack db query builder

## Development
Architecture:
- `./src/ast` - navigate typesafe AST:
  - `./src/ast/shared` - shared AST nodes across multiple clauses.
  - Transforms AST nodes to steps in the Tanstack db query builder.
- `./src/util` - non AST stuff.

## Design considerations
### Minimise _'prop drilling'_
Ideally queries should be built clause by clause to minimise abstractions. Constructing queries more explicitly should improve debuggability.

### More lenient AST grammar
Assuming Tanstack db has it's own validation errors, the interpreter can afford more flexible grammars. Edge cases don't need to be covered, so less code is needed.

### Exhaustive AST typechecking
Switch statments checks if default case is `never` for exhaustive typesafety:
```
const n = node
switch (n.name) {
  case 'NODE_1':
    ...
    break
  case 'NODE_2:
    ...
    break
  default:
    n satisfies never // Except we'll throw an error
}
```

## Caveats
### Possibly degraded typesafety
Due to the use of generics in the query builder, [types cannot be inferred](https://tanstack.com/db/latest/docs/guides/live-queries#why-not-type-querybuilder).

Nevertheless for user input, this should not be an issue. For developers, this is not recommended.
