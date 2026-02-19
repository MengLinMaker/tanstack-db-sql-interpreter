import { strictParseSql } from '@menglinmaker/sql-parser'
import { selectStatementNode } from './ast/selectStatementNode'
import { LiveQuerySqlError } from './error'
import type { Collections } from './types'

export const liveQuerySql = (collections: Collections, sql: string) => {
  const ast = strictParseSql(sql)
  if (ast.children[0]!.name === 'SELECT_STATEMENT') {
    return selectStatementNode(ast.children[0]!, collections)
  }
  throw new LiveQuerySqlError('Cannot find CTE or SELECT statement')
}
