import { LiveQuerySqlError } from '../error'
import type { Collections } from '../types'

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
    throw new LiveQuerySqlError(`'tableName' collection table not found`)
  const singleDataPoint = collection.entries().next().value[1]
  return Object.keys(singleDataPoint)
}
