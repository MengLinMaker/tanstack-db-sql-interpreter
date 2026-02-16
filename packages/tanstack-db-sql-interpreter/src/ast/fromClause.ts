import type { Node } from '@menglinmaker/sql-parser'
import {
  type Context,
  eq,
  type InitialQueryBuilder,
  type QueryBuilder,
} from '@tanstack/db'
import { defaultSwitchNodeError } from '../error'
import {
  columnNotFoundCheck,
  findColumnFromTables,
  singleCollectionsFilter,
} from '../helpers/collection.ts'
import { stringifyObject } from '../helpers/print.ts'
import type { Collections } from '../types.ts'
import { columnNode } from './common.ts'

export const fromNode = (
  node: Node.FROM,
  q: InitialQueryBuilder,
  collections: Collections,
) => {
  // Accessed tables
  const newCollections: Collections = {}

  for (const n of node.children) {
    switch (n.name) {
      case 'FROM__':
        break
      case 'TABLE': {
        const table = tableNode(n)
        const selectedCollection = singleCollectionsFilter(
          collections,
          table.name,
        )
        newCollections[table.alias] = selectedCollection
        q = q.from(newCollections) as never

        const fromTableAliases: { [key: string]: string } = {}
        fromTableAliases[table.alias] = table.name
        console.debug(`q.from(${stringifyObject(fromTableAliases)})`)
        break
      }
      case 'JOIN_EXPRESSION': {
        const join = joinExpressionNode(n, collections, newCollections)
        const joinedCollection: Collections = {}
        joinedCollection[join.table.alias] = singleCollectionsFilter(
          collections,
          join.table.name,
        )
        newCollections[join.table.alias] = joinedCollection[
          join.table.alias
        ] as never

        q = (q as never as QueryBuilder<Context>).join(
          joinedCollection,
          (e) =>
            eq(
              e[join.method.joinColumn.table]![join.method.joinColumn.column],
              e[join.method.otherColumn.table]![join.method.otherColumn.column],
            ),
          join.type,
        ) as never

        const tableAliases: { [key: string]: string } = {}
        tableAliases[join.table.alias] = join.table.name
        console.debug(` .join(
   ${stringifyObject(tableAliases)},
   c => eq(c.${join.method.joinColumn.table}.${join.method.joinColumn.column}, c.${join.method.otherColumn.table}.${join.method.otherColumn.column}),
   '${join.type}'
 )`)
        break
      }
      default:
        throw defaultSwitchNodeError(n)
    }
  }
  return {
    query: q as never as QueryBuilder<Context>,
    collections: newCollections,
  }
}

const tableNode = (node: Node.TABLE) => {
  const n = node.children[0]
  switch (n.name) {
    case 'TABLE_NAME__':
      return {
        name: n.value,
        alias: n.value,
      }
    case 'TABLE_ALIAS':
      return {
        name: n.children[0].value,
        alias: n.children[1].value,
      }
    default:
      throw defaultSwitchNodeError(n)
  }
}

const joinExpressionNode = (
  n: Node.JOIN_EXPRESSION,
  collections: Collections,
  newCollections: Collections,
) => {
  const joinTypeNode = n.children[0]
  const joinTypeMap = {
    JOIN: 'left',
    LEFT_JOIN: 'left',
    RIGHT_JOIN: 'right',
    INNER_JOIN: 'inner',
    FULL_JOIN: 'full',
  } as const
  const table = tableNode(n.children[1])
  const method = joinMethodNode(
    n.children[2],
    collections,
    newCollections,
    table,
  )
  return {
    type: joinTypeMap[joinTypeNode.children[0].name],
    table,
    method,
  }
}

const joinMethodNode = (
  node: Node.JOIN_METHOD,
  collections: Collections,
  newCollections: Collections,
  table: {
    name: string
    alias: string
  },
) => {
  const n = node.children[0]
  switch (n.name) {
    case 'ON': {
      const joinColumn = columnNode(n.children[1], collections)
      const otherColumn = columnNode(n.children[3], newCollections)
      return { joinColumn, otherColumn }
    }
    case 'USING': {
      const column = n.children[1].value
      columnNotFoundCheck(collections, table, column)
      const otherColumn = findColumnFromTables(newCollections, column)
      return {
        joinColumn: { table: table.alias, column },
        otherColumn,
      }
    }
    default:
      throw defaultSwitchNodeError(n)
  }
}
