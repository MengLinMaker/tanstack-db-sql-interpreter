import { faker, fakerEN_AU } from '@faker-js/faker'
import type { z } from 'zod/mini'
import type { schemaZod } from '../schema/collections.ts'

const possible_home_feature_table: z.infer<
  typeof schemaZod.home_feature_table
>[] = []
{
  let count = 1
  for (let bed = 1; bed < 5; bed++) {
    for (let bath = 1; bath < 3; bath++) {
      for (let car = 1; car < 3; car++) {
        possible_home_feature_table.push({
          id: count++,
          bed_quantity: bed,
          bath_quantity: bath,
          car_quantity: car,
        })
      }
    }
  }
}

const possible_locality_table: z.infer<typeof schemaZod.locality_table>[] = []
{
  let count = 1
  for (let bed = 1; bed < 1000; bed++) {
    possible_locality_table.push({
      id: count++,
      suburb_name: fakerEN_AU.location.city(),
      postcode: fakerEN_AU.location.zipCode('####'),
      state_abbreviation: fakerEN_AU.location.state({}),
    })
  }
}

let home_table_id = 1
export const generate = {
  home_table: () => {
    return {
      id: home_table_id++,
      locality_table_id: faker.number.int({
        min: 1,
        max: possible_locality_table.length,
      }),
      home_feature_table_id: faker.number.int({
        min: 1,
        max: possible_home_feature_table.length,
      }),
      street_address: fakerEN_AU.location.streetAddress(),
      higher_price_aud: faker.number.int({ min: 100000, max: 1000000 }),
    } satisfies z.infer<typeof schemaZod.home_table>
  },
}

export const seed = {
  home_feature_table: possible_home_feature_table,
  locality_table: possible_locality_table,
}
