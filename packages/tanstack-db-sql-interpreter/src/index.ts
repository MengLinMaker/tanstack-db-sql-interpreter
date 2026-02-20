import { strictParseSql } from '@menglinmaker/sql-parser'
import type { InitialQueryBuilder } from '@tanstack/db'
import { cteNode } from './ast/cte.ts'
import { selectStatementNode } from './ast/selectStatementNode.ts'
import { defaultSwitchNodeError } from './util/error.ts'
import type { Collections } from './util/types.ts'

export const liveQuerySql = (collections: Collections, sql: string) => {
  const ast = strictParseSql(sql)
  const queryBuilder = (query: InitialQueryBuilder) => {
    const n = ast.children[0]
    switch (n.name) {
      case 'SELECT_STATEMENT':
        return selectStatementNode(n, query, collections)
      case 'CTE':
        return cteNode(n, query, collections)
      default:
        throw defaultSwitchNodeError(n)
    }
  }
  return queryBuilder
}
