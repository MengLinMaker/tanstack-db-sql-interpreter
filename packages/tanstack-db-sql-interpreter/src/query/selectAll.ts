import { LiveQuerySqlError } from '../error'
import { collectionProperties } from '../helpers/collectionProperties'
import type { Collections } from '../types'

export const selectAll = (collections: Collections, q: any) => {
  const selectObj: {
    [key: string | number | symbol]: any
  } = {}
  for (const tableName of Object.keys(collections)) {
    for (const property of collectionProperties(collections, tableName)) {
      if (selectObj[property])
        throw new LiveQuerySqlError(
          `'${property}' already selected, clashes with '${tableName}.${property}'`,
        )
      selectObj[property] = q[tableName][property]
    }
  }
  return selectObj
}
