import { Parser } from 'node-sql-parser/build/postgresql'

class SupportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SupportError'
  }
}

class MultipleQueryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MultipleQueryError'
  }
}

export const parseTanstackDbSql = (sql: string) => {
  const parser = new Parser()
  const ast = parser.astify(sql)

  if (Array.isArray(ast))
    throw new MultipleQueryError('Cannot have multiple SQL queries')

  if (ast.type !== 'select')
    throw new SupportError(
      `${ast.type.toUpperCase()} is not supported in tanstack db`,
    )
  return ast
}
