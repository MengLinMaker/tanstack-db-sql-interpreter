import { describe, expect, it } from 'vitest'
import { liveQuerySql } from '../../src/liveQuerySql.ts'
import { eagerLiveQueryCollection, testCollectionFactory } from '../helper.ts'

describe('LIMIT clause', () => {
  const table_1 = testCollectionFactory()
  const seedTables = () => {
    const insert = (id: number) => table_1.insert({ id })
    for (let i = 0; i < 100; i++) insert(i)
  }

  it('LIMIT', () => {
    const limit = 10
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1 },
        `SELECT * FROM table_1
         ORDER BY id
         LIMIT ${limit}`,
      ),
    )
    const result = newCollection.toArray
    expect(result.length).toBe(limit)
    expect(result[0]).toStrictEqual(table_1.toArray[0])
  })

  it('OFFSET', () => {
    const limit = 10
    const offset = 10
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1 },
        `SELECT * FROM table_1
         ORDER BY id
         LIMIT ${limit} OFFSET ${offset}`,
      ),
    )
    const result = newCollection.toArray
    expect(result.length).toBe(limit)
    expect(result[0]).toStrictEqual(table_1.toArray[offset])
  })
})
