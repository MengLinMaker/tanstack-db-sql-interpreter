import type { Node } from '@menglinmaker/sql-parser'
import { defaultSwitchNodeError } from '../error'
import type { Collections } from '../types'
import { columnNode } from './common'

export const orderNode = (node: Node.ORDER, collections: Collections) => {
  const columns: {
    table: string
    column: string
    type: 'asc' | 'desc'
  }[] = []
  for (const n of node.children) {
    switch (n.name) {
      case 'ORDER__':
      case 'BY__':
        break
      case 'ORDER_EXPRESSION': {
        columns.push(orderExpressionNode(n, collections))
        break
      }
      default:
        throw defaultSwitchNodeError(n)
    }
  }
  return columns
}

const orderExpressionNode = (
  node: Node.ORDER_EXPRESSION,
  collections: Collections,
) => {
  const n = node.children[0]
  switch (n.name) {
    case 'ORDER_COLUMN':
      return {
        ...columnNode(n.children[0], collections),
        type: 'asc',
      } as const
    case 'ORDER_ASC':
      return {
        ...columnNode(n.children[0], collections),
        type: 'asc',
      } as const
    case 'ORDER_DESC':
      return {
        ...columnNode(n.children[0], collections),
        type: 'desc',
      } as const
    default:
      throw defaultSwitchNodeError(n)
  }
}
