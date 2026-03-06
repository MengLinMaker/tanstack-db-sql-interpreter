import { type Collection, createCollection } from '@tanstack/db'
import { schemaZod } from '../util/schema/collections'

export type TanstackCollections = {
  [key: string]: Collection<any, any, any, any, any>
}

export const tanstackDbFactory = (): TanstackCollections => {
  const collections: TanstackCollections = {}
  for (const [key, tableSchema] of Object.entries(schemaZod)) {
    collections[key] = createCollection({
      schema: tableSchema,
      getKey: (collection) => collection.id,
      sync: { sync: () => {} },
      onInsert: async () => {},
    })
  }
  return collections
}
