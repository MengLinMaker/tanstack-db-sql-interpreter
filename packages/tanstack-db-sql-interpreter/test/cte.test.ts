import { describe, expect, it } from 'vitest'
import { liveQuerySql } from '../src/index.ts'
import { eagerLiveQueryCollection, testCollectionFactory } from './helper.ts'

describe('CTE', () => {
  const table_1 = testCollectionFactory()
  const seedTables = () => {
    const insert = (n: number) =>
      table_1.insert({
        id: n,
        a: Math.floor(n / 2),
        b: Math.floor(n / 3),
      })
    for (let i = 0; i < 6; i++) insert(i)
  }

  it('all columns', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1 },
        `WITH table_2 AS (
           SELECT * FROM table_1
         ),
         table_3 AS (
           SELECT * FROM table_2 
         )
         SELECT * FROM table_3`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual(table_1.toArray)
  })
})
