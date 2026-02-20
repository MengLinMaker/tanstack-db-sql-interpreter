import type { Node } from '@menglinmaker/sql-parser'
import type { InitialQueryBuilder } from '@tanstack/db'
import type { Collections } from '../util/types'
import { selectStatementNode } from './selectStatementNode'

export const cteNode = (
  node: Node.CTE,
  q: InitialQueryBuilder,
  collections: Collections,
) => {
  for (const n of node.children[1].children) {
    const tableAlias = n.children[0].value
    console.debug(`${tableAlias} = `)
    collections[tableAlias] = selectStatementNode(
      n.children[2],
      q,
      collections,
    ) as never
  }
  return selectStatementNode(node.children[2], q, collections)
}
