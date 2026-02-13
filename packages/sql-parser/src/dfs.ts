import type { AST } from 'node-sql-parser'

const astDfs = (ast: AST, func: () => void) => {
  if (ast.type !== 'select') return
  ast.from
}
