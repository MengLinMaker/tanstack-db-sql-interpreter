import { createCollection } from '@tanstack/db'
import * as z from 'zod/mini'

export const schemaZod = {
  home_feature_table: z.strictObject({
    id: z.number(),
    bed_quantity: z.number(),
    bath_quantity: z.number(),
    car_quantity: z.number(),
  }),
  locality_table: z.strictObject({
    id: z.number(),
    suburb_name: z.string(),
    postcode: z.string(),
    state_abbreviation: z.string(),
  }),
  home_table: z.strictObject({
    id: z.number(),
    locality_table_id: z.number(),
    home_feature_table_id: z.number(),
    street_address: z.string(),
    higher_price_aud: z.number(),
  }),
}

const schema: {
  [key: string]: string[]
} = {}
for (const [key, tableSchema] of Object.entries(schemaZod))
  schema[key] = Object.keys(tableSchema.shape)
export { schema }

export const home_feature_table = createCollection({
  schema: schemaZod.home_feature_table,
  getKey: (collection) => collection.id,
  sync: { sync: () => {} },
})
export const locality_table = createCollection({
  schema: schemaZod.locality_table,
  getKey: (collection) => collection.id,
  sync: { sync: () => {} },
})
export const home_table = createCollection({
  schema: schemaZod.home_table,
  getKey: (collection) => collection.id,
  sync: { sync: () => {} },
})
