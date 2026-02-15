import type { Node } from '@menglinmaker/sql-parser'
import type { Context, QueryBuilder } from '@tanstack/db'
import type { Collections } from '../types'
import { defaultSwitchNodeError } from '../error'
import { selectAll } from '../query/selectAll'

export const selectNode = (
  node: Node.SELECT,
  q: QueryBuilder<Context>,
  collections: Collections,
) => {
  for (const n of node.children) {
    switch (n.name) {
      case 'SELECT__':
        break
      case 'DISTINCT__':
        break
      case 'SELECT_EXPRESSION':
        break
      case 'EXCLUDE':
        break
      default:
        throw defaultSwitchNodeError(n)
    }
  }
  // TODO: properly implement SELECT
  q = q.select((q) => selectAll(collections, q))
  return { query: q }
}
