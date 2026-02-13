import { LiveQuerySqlError } from '../error'
import type { Collections } from '../types'

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
