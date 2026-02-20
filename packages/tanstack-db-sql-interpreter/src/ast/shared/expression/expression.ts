import type { Node } from '@menglinmaker/sql-parser'
import { and, count, eq, gte, inArray, lte, not } from '@tanstack/db'
import { collectionProperties } from '../../../util/collection.ts'
import { defaultSwitchNodeError } from '../../../util/error.ts'
import type { Collections } from '../../../util/types.ts'
import { columnNode } from '../column.ts'
import { getExpressionMap } from './expressionMap.ts'

export type Expression =
  | ExpressionFunc
  | ExpressionColumn
  | ExpressionLiteral
  | ExpressionArray
type ExpressionFunc = {
  type: 'function'
  func: ReturnType<typeof getExpressionMap>
  args: Expression[]
}
type ExpressionColumn = {
  type: 'column'
  column: ReturnType<typeof columnNode>
}
type ExpressionLiteral = {
  type: 'literal'
  value: ReturnType<typeof literalNode>
}
type ExpressionArray = {
  type: 'array'
  args: Expression[]
}

export const expressionNode = (
  node: Node.EXPRESSION,
  collections: Collections,
): Expression => {
  const n = node.children[0]
  switch (n.name) {
    case 'PARENTHESIS_EXPRESSION':
      return expressionNode(n.children[0], collections)
    case 'FUNC_SINGLE':
      return {
        type: 'function',
        func: getExpressionMap(n.children[0].children[0].name),
        args: [expressionNode(n.children[0].children[1], collections)],
      }
    case 'FUNC_MANY':
      return {
        type: 'function',
        func: getExpressionMap(n.children[0].children[0].name),
        args: n.children[0].children[1].children.map((n) =>
          expressionNode(n, collections),
        ),
      }
    case 'OPERATOR':
      // Not equal edge case
      if (n.children[0].name === 'NOT_EQ') {
        return {
          type: 'function',
          func: not,
          args: [
            {
              type: 'function',
              func: eq,
              args: [
                expressionNode(n.children[0].children[0], collections),
                expressionNode(n.children[0].children[2], collections),
              ],
            },
          ],
        } as const satisfies ExpressionFunc
      }
      return {
        type: 'function',
        func: getExpressionMap(n.children[0].children[1].name),
        args: [
          expressionNode(n.children[0].children[0], collections),
          expressionNode(n.children[0].children[2], collections),
        ],
      }
    case 'LITERAL_VALUE':
      return {
        type: 'literal',
        value: literalNode(n),
      }
    case 'COLUMN': {
      return {
        type: 'column',
        column: columnNode(n, collections),
      }
    }

    // Expression edge case nodes
    case 'COUNT_ALL': {
      // Forced to select specific column due to query builder limitations
      const table = Object.keys(collections)[0]!
      const column = collectionProperties(collections, table)[0]!
      return {
        type: 'function',
        func: count,
        args: [
          {
            type: 'column',
            column: { table, column },
          },
        ],
      }
    }
    case 'IN_ARRAY': {
      n.children[0]
      return {
        type: 'function',
        func: inArray,
        args: [
          expressionNode(n.children[0], collections),
          {
            type: 'array',
            args: n.children[2].children.map((n) =>
              expressionNode(n, collections),
            ),
          },
        ],
      }
    }
    case 'BETWEEN': {
      const compare = expressionNode(n.children[0], collections)
      return {
        type: 'function',
        func: and,
        args: [
          {
            type: 'function',
            func: gte,
            args: [compare, expressionNode(n.children[2], collections)],
          },
          {
            type: 'function',
            func: lte,
            args: [compare, expressionNode(n.children[4], collections)],
          },
        ],
      }
    }
    default:
      throw defaultSwitchNodeError(n)
  }
}

export const literalNode = (node: Node.LITERAL_VALUE) => {
  const n = node.children[0]
  switch (n.name) {
    case 'NUMERIC_LITERAL__':
      return Number(n.value)
    case 'STRING_LITERAL__': {
      const removeDuoQuote = n.value.replaceAll(`''`, `'`)
      const len = removeDuoQuote.length
      return removeDuoQuote.slice(1, len - 1)
    }
    case 'NULL__':
      return null
    case 'TRUE__':
      return true
    case 'FALSE__':
      return false
    case 'CURRENT_TIMESTAMP__':
      return new Date().toISOString()
    case 'CURRENT_TIME__':
      return new Date().toTimeString()
    case 'CURRENT_DATE__': {
      const d = new Date()
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }
    default:
      throw defaultSwitchNodeError(n)
  }
}
