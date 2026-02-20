import { strictParseSql } from '@menglinmaker/sql-parser'
import { selectStatementNode } from './ast/selectStatementNode.ts'
import { LiveQuerySqlError } from './util/error.ts'
import type { Collections } from './util/types.ts'

export const liveQuerySql = (collections: Collections, sql: string) => {
  const ast = strictParseSql(sql)
  if (ast.children[0]!.name === 'SELECT_STATEMENT') {
    return selectStatementNode(ast.children[0]!, collections)
  }
  throw new LiveQuerySqlError('Cannot find CTE or SELECT statement')
}
