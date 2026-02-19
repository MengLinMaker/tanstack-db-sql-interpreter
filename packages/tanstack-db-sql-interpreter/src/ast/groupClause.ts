import type { Node } from '@menglinmaker/sql-parser'
import { defaultSwitchNodeError } from '../error'
import type { Collections } from './../types'
import { columnNode } from './common'

export const groupNode = (node: Node.GROUP, collections: Collections) => {
  const columns: ReturnType<typeof columnNode>[] = []
  for (const n of node.children) {
    switch (n.name) {
      case 'GROUP__':
      case 'BY__':
        break
      case 'COLUMN': {
        columns.push(columnNode(n, collections))
        break
      }
      default:
        throw defaultSwitchNodeError(n)
    }
  }
  return columns
}
