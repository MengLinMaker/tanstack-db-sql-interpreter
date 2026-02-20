import type { Node } from '@menglinmaker/sql-parser'
import type { Context, QueryBuilder } from '@tanstack/db'
import { collectionProperties, collectionsFilter } from '../util/collection'
import { defaultSwitchNodeError } from '../util/error'
import { stringifyObjectMulti } from '../util/print'
import type { Collections } from '../util/types'
import { columnNode } from './shared/column'
import { type Expression, expressionNode } from './shared/expression'

type Select = {
  [columnAlias: string]: {
    table: string
    column: string
  }
}
type Expr = {
  [columnAlias: string]: Expression
}

export const selectNode = (
  node: Node.SELECT,
  q: QueryBuilder<Context>,
  collections: Collections,
) => {
  let exclude: string[] = []
  let select: Select = {}
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
        select = { ...select, ...result.select }
        expr = { ...expr, ...result.expr }
        break
      }
      case 'EXCLUDE':
        exclude = excludeNode(n)
        break
      default:
        throw defaultSwitchNodeError(n)
    }
  }
  for (const columnAlias of exclude) delete select[columnAlias]

  q = q.select((c) => {
    const selectObj: { [key: string]: any } = {}
    for (const [columnAlias, column] of Object.entries(select)) {
      selectObj[columnAlias] = c[column.table]![columnAlias]
    }
    return selectObj
  })

  const selectObj: { [key: string]: any } = {}
  for (const [columnAlias, column] of Object.entries(select)) {
    selectObj[columnAlias] = `c.${column.table}.${column.column}`
  }
  console.debug(` .select(c => (${stringifyObjectMulti(selectObj)}))`)
  return { query: q }
}

export const selectExpressionNode = (
  node: Node.SELECT_EXPRESSION,
  collections: Collections,
) => {
  const n = node.children[0]
  switch (n.name) {
    case 'SELECT_ALL':
      return {
        select: allColumns(collections),
        expr: {},
      }
    case 'SELECT_TABLE': {
      const table = n.children[0].value
      return {
        select: allColumns(collectionsFilter(collections, [table])),
        expr: {},
      }
    }
    case 'SELECT_COLUMN': {
      const column = columnNode(n.children[0], collections)
      return {
        select: { [column.column]: column },
        expr: {},
      }
    }
    case 'SELECT_EXPRESSION_AS':
      return {
        select: {},
        expr: expressionNode(n.children[0], collections),
      }
    default:
      throw defaultSwitchNodeError(n)
  }
}

const allColumns = (collections: Collections) => {
  const select: Select = {}
  for (const table of Object.keys(collections)) {
    for (const column of collectionProperties(collections, table))
      select[column] = { table, column }
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
