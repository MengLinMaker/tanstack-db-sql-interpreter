import { strictParseSql } from '@menglinmaker/sql-parser'
import type {
  BaseQueryBuilder,
  Context,
  InitialQueryBuilder,
  QueryBuilder,
} from '@tanstack/db'
import { cteNode } from './ast/cte.ts'
import { selectStatementNode } from './ast/selectStatementNode.ts'
import { defaultSwitchNodeError } from './util/error.ts'
import type { Collections } from './util/types.ts'

type CallbackQueryIR = (
  queryIr: ReturnType<BaseQueryBuilder['_getQuery']>,
) => void

export const liveQuerySql = (
  collections: Collections,
  sql: string,
  callback: undefined | CallbackQueryIR = undefined,
) => {
  const ast = strictParseSql(sql)
  const queryBuilder = (query: InitialQueryBuilder) => {
    const n = ast.children[0]
    let q: QueryBuilder<Context>
    switch (n.name) {
      case 'SELECT_STATEMENT':
        q = selectStatementNode(n, query, collections)
        break
      case 'CTE':
        q = cteNode(n, query, collections)
        break
      default:
        throw defaultSwitchNodeError(n)
    }
    if (callback) callback((q as BaseQueryBuilder)._getQuery())
    return q
  }
  return queryBuilder
}
