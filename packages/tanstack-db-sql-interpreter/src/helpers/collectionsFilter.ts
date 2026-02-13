import { LiveQuerySqlError } from '../error'
import type { Collections } from '../types'

export const collectionsFilter = <T extends Collections>(
  collections: T,
  tableNames: (keyof T)[],
) => {
  const collectionsObj: T = {} as never
  for (const tableName of tableNames) {
    if (!collections[tableName])
      throw new LiveQuerySqlError(
        `'${tableName as string}' collection table cannot be found`,
      )
    collectionsObj[tableName] = collections[tableName]
  }
  return collectionsObj as T
}
