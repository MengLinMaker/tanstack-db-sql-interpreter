import { strictParseSql } from '@menglinmaker/sql-parser'
import type { Context, InitialQueryBuilder, QueryBuilder } from '@tanstack/db'
import { selectStatementNode } from './ast/selectStatementNode'
import type { Collections } from './types'

export const liveQuerySql = (collections: Collections, sql: string) => {
  const ast = strictParseSql(sql)
  if (ast.children[0]!.name === 'SELECT_STATEMENT') {
    return selectStatementNode(ast.children[0]!, collections)
  }

  const queryBuilder = (q: InitialQueryBuilder) => {}
  return queryBuilder as never as QueryBuilder<Context>
}
