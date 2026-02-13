# @menglinmaker/tanstack-db-sql-interpreter
Interprets SQL to 

## Caveats
### Degraded typesafety
Due to the use of generics in the query builder, [types cannot be inferred](https://tanstack.com/db/latest/docs/guides/live-queries#why-not-type-querybuilder).

Nevertheless for user input, this should not be an issue. For developers, this is not recommended.

