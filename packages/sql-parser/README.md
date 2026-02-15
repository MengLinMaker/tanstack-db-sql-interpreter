# @menglinmaker/sql-parser
Typesafe, child-aware, JavaScript parser with `SELECT` only SQL grammar support.

## Development
Architecture:
- `./src/grammar` - custom SQL grammar using [lezer](https://lezer.codemirror.net/)
  - Grammar should ideally only consist of 'Choice' or 'Sequence' rules for typesafety
  - Tokens end with '__'
  - All capitalised rules will exist in AST
- `./src/gen` - type generator for child-aware AST
- `./src/parser` - custom AST transformer format

## Design considerations
### Focus on grammar simplicity
The grammar will focus on simplicity, using SQLite as an example:
  - Grammar inspired by Antlr4 SQLite: https://github.com/antlr/grammars-v4/tree/master/sql/sqlite
  - SQLite parser grammar documentation: https://sqlite.org/syntaxdiagrams.html#select-stmt
  - Simple grammar for static analysis (code generation) and navigation

### Typesafe, child aware AST
Problem - maintainence and correctness issues:
- How do we automatically locate breaking changes when grammar updates?
- Is it possible to achieve this with a minimal constant test suite as the grammar grows?

Solution - TypeScript code generation in custom AST format:
- Child-aware AST:
  - What types of children can we have?
  - How many children we can have?
  - Where are each children located?
- Exhaustive - What edge case? It's all covered.

Implementation:
1. Parse lezer grammar - which should ideally only use simple features:
  - Could create a checker to limit types of grammar features used
2. Find grammar rules and extract dependent rules (children)
3. Generate typescript:
  - Refer to: https://ts-ast-viewer.com
