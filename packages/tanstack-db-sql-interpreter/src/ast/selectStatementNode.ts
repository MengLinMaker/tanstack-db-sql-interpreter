import type { ChildrenName, Node } from '@menglinmaker/sql-parser'
import type { Context, QueryBuilder } from '@tanstack/db'
import { defaultSwitchNodeError } from '../error'
import type { Collections } from '../types'
import { fromNode } from './fromClause'
import { selectNode } from './selectClause'

const reorderSelectClauses = (node: Node.SELECT_STATEMENT) => {
  const clauseOrder: {
    [key in ChildrenName<typeof node>]: number
  } = {
    FROM: 1,
    WHERE: 2,
    GROUP: 3,
    SELECT: 4,
    HAVING: 5,
    ORDER: 6,
    LIMIT: 7,
  }
  return node.children.sort((a, b) => clauseOrder[a.name] - clauseOrder[b.name])
}

export const selectStatementNode = (
  node: Node.SELECT_STATEMENT,
  collections: Collections,
) => {
  const reorderedClauseNodes = reorderSelectClauses(node)

  const queryBuilder = (q: QueryBuilder<Context>) => {
    let newCollections: Collections = {}

    for (const n of reorderedClauseNodes) {
      switch (n.name) {
        case 'FROM': {
          const result = fromNode(n, q as never, collections)
          q = result.query
          newCollections = result.collections
          break
        }
        case 'WHERE':
          break
        case 'GROUP':
          break
        case 'SELECT': {
          const result = selectNode(n, q, newCollections)
          q = result.query
          break
        }
        case 'HAVING':
          break
        case 'ORDER':
          break
        case 'LIMIT':
          break
        default:
          throw defaultSwitchNodeError(n)
      }
    }
    return q
  }
  return queryBuilder as never as QueryBuilder<Context>
}
