import type { Node } from '@menglinmaker/sql-parser'
import {
  add,
  and,
  avg,
  coalesce,
  concat,
  count,
  eq,
  gt,
  gte,
  ilike,
  length,
  like,
  lower,
  lt,
  lte,
  max,
  min,
  not,
  or,
  sum,
  upper,
} from '@tanstack/db'
import { collectionProperties } from '../../util/collection.ts'
import { defaultSwitchNodeError } from '../../util/error.ts'
import type { Collections } from '../../util/types.ts'
import { columnNode } from './column.ts'

const notEq = (a, b) => not(eq(a, b))

const expressionMap = {
  // FUNC_SINGLE
  UPPER__: upper,
  LOWER__: lower,
  LENGTH__: length,
  NOT__: not,
  COUNT__: count,
  SUM__: sum,
  AVG__: avg,
  MIN__: min,
  MAX__: max,
  // FUNC_MANY
  CONCAT__: concat,
  COALESCE__: coalesce,
  // OPERATOR
  EQUAL__: eq,
  NOT_EQ__: notEq,
  GT__: gt,
  GTE__: gte,
  LT__: lt,
  LTE__: lte,
  IS__: eq,
  AND__: and,
  OR__: or,
  LIKE__: like,
  ILIKE__: ilike,
  PLUS__: add,
} as const
const getExpressionMap = (key: keyof typeof expressionMap) => expressionMap[key]

export type Expression = ExpressionFunc | ExpressionColumn | ExpressionLiteral
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
    case 'COUNT_ALL': {
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
    default:
      throw defaultSwitchNodeError(n)
  }
}

const literalNode = (node: Node.LITERAL_VALUE) => {
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
