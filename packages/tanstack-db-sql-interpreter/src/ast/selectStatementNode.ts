import type { Node } from '@menglinmaker/sql-parser'
import type { Context, InitialQueryBuilder, QueryBuilder } from '@tanstack/db'
import { defaultSwitchNodeError } from '../error'
import type { Collections } from '../types'
import { fromNode } from './fromClause'
import { selectNode } from './selectClause'
import { limitNode } from './limitClause'

export const selectStatementNode = (
  node: Node.SELECT_STATEMENT,
  collections: Collections,
) => {
  const queryBuilder = (query: InitialQueryBuilder) => {
    const fromRes = fromNode(node.children[1], query, collections)
    const c = fromRes.collections
    const selectResult = selectNode(node.children[0], fromRes.query, c)
    let q = selectResult.query

    for (const n of node.children[2].children) {
      switch (n.name) {
        case 'WHERE':
          break
        case 'GROUP':
          break
        case 'HAVING':
          break
        case 'ORDER':
          break
        case 'LIMIT': {
          const { limit, offset } = limitNode(n)
          q = q.limit(limit)
          if (offset) q = q.offset(offset)
          console.debug(` .limit(${limit})`)
          if (offset) console.debug(` .offset(${offset})`)
          break
        }
        default:
          throw defaultSwitchNodeError(n)
      }
    }
    return q
  }
  return queryBuilder as never as QueryBuilder<Context>
}
