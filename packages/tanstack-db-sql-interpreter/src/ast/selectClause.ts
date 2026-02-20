import type { Node } from '@menglinmaker/sql-parser'
import type { BaseQueryBuilder, Context, QueryBuilder } from '@tanstack/db'
import { collectionProperties, collectionsFilter } from '../util/collection.ts'
import {
  defaultSwitchExprError,
  defaultSwitchNodeError,
} from '../util/error.ts'
import { stringifyObjectMulti } from '../util/print.ts'
import type { Collections } from '../util/types.ts'
import { columnNode } from './shared/column.ts'
import {
  type Expression,
  expressionNode,
} from './shared/expression/expression.ts'
import { applyExpression } from './shared/expression/apply.ts'
import { stringifyExpression } from './shared/expression/stringify.ts'

type Expr = {
  [columnAlias: string]: Expression
}

export const selectNode = (
  node: Node.SELECT,
  q: QueryBuilder<Context>,
  collections: Collections,
) => {
  let exclude: string[] = []
  let expr: Expr = {}
  for (const n of node.children) {
    switch (n.name) {
      case 'SELECT__':
        break
      case 'DISTINCT__':
        q = q.distinct()
        break
      case 'SELECT_EXPRESSION': {
        const result = selectExpressionNode(n, collections)
        expr = { ...expr, ...result }
        break
      }
      case 'EXCLUDE':
        exclude = excludeNode(n)
        break
      default:
        throw defaultSwitchNodeError(n)
    }
  }
  for (const columnAlias of exclude) delete expr[columnAlias]

  q = q.select((c) => {
    const selectObj: { [key: string]: any } = {}
    for (const [columnAlias, expression] of Object.entries(expr)) {
      selectObj[columnAlias] = applyExpression(expression, c)
    }
    return selectObj
  })

  const selectObj: { [key: string]: any } = {}
  for (const [columnAlias, expression] of Object.entries(expr)) {
    selectObj[columnAlias] = stringifyExpression(expression)
  }
  console.debug(` .select(c => (${stringifyObjectMulti(selectObj)}))`)
  return { query: q }
}

export const selectExpressionNode = (
  node: Node.SELECT_EXPRESSION,
  collections: Collections,
): Expr => {
  const n = node.children[0]
  switch (n.name) {
    case 'SELECT_ALL': {
      return allColumns(collections)
    }
    case 'SELECT_TABLE': {
      const table = n.children[0].value
      return allColumns(collectionsFilter(collections, [table]))
    }
    case 'SELECT_COLUMN': {
      const column = columnNode(n.children[0], collections)
      return {
        [column.column]: {
          type: 'column',
          column,
        },
      }
    }
    case 'SELECT_EXPRESSION_AS':
      return {
        [n.children[2].children[0].value]: expressionNode(
          n.children[0],
          collections,
        ),
      }
    default:
      throw defaultSwitchNodeError(n)
  }
}

const allColumns = (collections: Collections) => {
  const select: Expr = {}
  for (const table of Object.keys(collections)) {
    for (const column of collectionProperties(collections, table))
      select[column] = { type: 'column', column: { table, column } }
  }
  return select
}

const excludeNode = (node: Node.EXCLUDE) => {
  const columns: string[] = []
  for (const n of node.children) {
    switch (n.name) {
      case 'EXCLUDE__':
        break
      case 'COLUMN_NAME__':
        columns.push(n.value)
        break
      default:
        throw defaultSwitchNodeError(n)
    }
  }
  return columns
}
