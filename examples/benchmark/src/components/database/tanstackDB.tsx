import { type Collection, createCollection } from '@tanstack/db'
import { createContext } from 'solid-js'
import { schemaZod } from '../../schema/collections'

export const tanstackDbFactory = () => {
  const collections: {
    [key: string]: Collection<any, any, any, any, any>
  } = {}
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

export const TanstackDB = createContext<ReturnType<typeof tanstackDbFactory>>(
  tanstackDbFactory(),
)
