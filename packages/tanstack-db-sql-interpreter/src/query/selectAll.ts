import { collectionProperties } from '../helpers/collection'
import type { Collections } from '../types'

export const selectAll = (collections: Collections, q: any) => {
  const selectObj: {
    [key: string]: any
  } = {}
  for (const tableName of Object.keys(collections)) {
    for (const property of collectionProperties(collections, tableName)) {
      // TODO: should you warn about clashing properties?
      // if (selectObj[property])
      //   console.warn(
      //     `'${property}' already selected, clashes with '${tableName}.${property}'`,
      //   )
      selectObj[property] = q[tableName][property]
    }
  }
  return selectObj
}
