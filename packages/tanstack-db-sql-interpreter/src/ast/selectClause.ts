import type { Node } from '@menglinmaker/sql-parser'
import type { Context, QueryBuilder } from '@tanstack/db'
import type { Collections } from '../types'
import { defaultSwitchNodeError } from '../error'
import { collectionProperties, collectionsFilter } from '../helpers/collection'
import { columnNode } from './common'

type Select = {
  [key: string]: {
    table: string
    column: string
  }
}

export const selectNode = (
  node: Node.SELECT,
  q: QueryBuilder<Context>,
  collections: Collections,
) => {
  let exclude: string[] = []
  let select: Select = {}
  for (const n of node.children) {
    switch (n.name) {
      case 'SELECT__':
        break
      case 'DISTINCT__':
        q = q.distinct()
        break
      case 'SELECT_EXPRESSION':
        select = selectExpressionNode(n, collections)
        break
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
  console.debug(
    ` .select(c => ${JSON.stringify(selectObj, null, 2).replaceAll('"', '').replaceAll('\n', '\n ')})`,
  )
  return { query: q }
}

export const selectExpressionNode = (
  node: Node.SELECT_EXPRESSION,
  collections: Collections,
) => {
  let select: Select = {}
  const n = node.children[0]
  switch (n.name) {
    case 'SELECT_ALL': {
      const columns = allColumns(collections)
      select = { ...select, ...columns }
      break
    }
    case 'SELECT_TABLE': {
      const table = n.children[0].value
      const columns = allColumns(collectionsFilter(collections, [table]))
      select = { ...select, ...columns }
      break
    }
    case 'SELECT_COLUMN': {
      const column = columnNode(n.children[0], collections)
      select = { ...select, [column.column]: column }
      break
    }
    case 'SELECT_COLUMN_AS': {
      const column = columnNode(n.children[0], collections)
      const columnAlias = n.children[2].children[0].value
      select = { ...select, [columnAlias]: column }
      break
    }
    case 'SELECT_AGGREGATE':
      break
    case 'SELECT_AGGREGATE_AS':
      break
    default:
      throw defaultSwitchNodeError(n)
  }
  return select
}

export const allColumns = (collections: Collections) => {
  const select: Select = {}
  for (const table of Object.keys(collections)) {
    for (const column of collectionProperties(collections, table))
      select[column] = { table, column }
  }
  return select
}

export const excludeNode = (node: Node.EXCLUDE) => {
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
