import type { Node } from '@menglinmaker/sql-parser'
import { defaultSwitchNodeError } from '../util/error.ts'

export const limitNode = (node: Node.LIMIT) => {
  const n = node.children[0]
  switch (n.name) {
    case 'LIMIT_EXPRESSION':
      return {
        limit: Number(n.children[1].value),
      }
    case 'OFFSET':
      return {
        limit: Number(n.children[1].value),
        offset: Number(n.children[3].value),
      }
    default:
      throw defaultSwitchNodeError(n)
  }
}
