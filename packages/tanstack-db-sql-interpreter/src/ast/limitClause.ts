import type { Node } from '@menglinmaker/sql-parser'
import { defaultSwitchNodeError } from '../error'

export const limitNode = (node: Node.LIMIT) => {
  const n = node.children[0]
  switch (n.name) {
    case 'LIMIT_EXPRESSION':
      return {
        limit: Number(n.children[1]),
      }
    case 'OFFSET':
      return {
        limit: Number(n.children[1]),
        offset: Number(n.children[1]),
      }
    default:
      throw defaultSwitchNodeError(n)
  }
}
