import { BaseQueryBuilder } from '@tanstack/db'
import { LiveQuerySqlError } from './error.ts'
import type { Collections } from './types.ts'

export const singleCollectionsFilter = <T extends Collections>(
  collections: T,
  tableName: keyof T,
) => {
  if (!collections[tableName])
    throw new LiveQuerySqlError(`Table not found: '${tableName as never}'`)
  return collections[tableName]
}

export const collectionsFilter = <T extends Collections>(
  collections: T,
  tableNames: (keyof T)[],
) => {
  const collectionsObj: T = {} as never
  for (const tableName of tableNames) {
    collectionsObj[tableName] = singleCollectionsFilter(collections, tableName)
  }
  return collectionsObj as T
}

export const collectionProperties = (
  collections: Collections,
  tableName: string,
) => {
  const collection = collections[tableName]
  if (!collection)
    throw new LiveQuerySqlError(`Collection table not found: '${tableName}'`)
  // Case BaseQueryBuilder
  if (collection instanceof BaseQueryBuilder) {
    const queryIR = collection._getQuery()
    if (queryIR.select) return Object.keys(queryIR.select)
    throw new LiveQuerySqlError(
      `'BaseQueryBuilder select keys not found: '${tableName}'`,
    )
  }
  // Case collection
  const singleDataPoint = collection.entries().next().value[1]
  return Object.keys(singleDataPoint)
}

export const findColumnFromTables = (
  collections: Collections,
  column: string,
) => {
  const tableNames = Object.keys(collections)
  for (const table of tableNames) {
    const properties = collectionProperties(collections, table)
    if (properties.includes(column)) return { table, column }
  }
  throw new LiveQuerySqlError(
    `Cannot find column '${column}' in tables: '${tableNames.join(`', '`)}'`,
  )
}

export const columnNotFoundCheck = (
  collections: Collections,
  table:
    | {
        name: string
        alias: string
      }
    | string,
  columnName: string,
) => {
  if (typeof table === 'string') {
    const properties = collectionProperties(collections, table)
    const hasProperty = properties.includes(columnName)
    if (!hasProperty)
      throw new LiveQuerySqlError(`Column not found: '${table}.${columnName}'`)
    return
  }
  const properties = collectionProperties(collections, table.name)
  const hasProperty = properties.includes(columnName)
  if (!hasProperty)
    throw new LiveQuerySqlError(
      `Column not found: '${table.alias}.${columnName}'`,
    )
}
