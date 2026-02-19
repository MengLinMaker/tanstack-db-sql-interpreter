import { describe, expect, it } from 'vitest'
import { liveQuerySql } from '../../src/liveQuerySql.ts'
import { eagerLiveQueryCollection, testCollectionFactory } from '../helper.ts'

describe('ORDER clause', () => {
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

  it('basic', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1 },
        `SELECT * FROM table_1
         ORDER BY id`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual(table_1.toArray)
  })

  it('ASC', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1 },
        `SELECT * FROM table_1
         ORDER BY id ASC`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual(table_1.toArray)
  })

  it('DESC', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1 },
        `SELECT * FROM table_1
         ORDER BY id DESC`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual(table_1.toArray.reverse())
  })

  it('multiple', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1 },
        `SELECT * FROM table_1
         ORDER BY b, a, id`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual(table_1.toArray)
  })

  it('multiple ASC', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1 },
        `SELECT * FROM table_1
         ORDER BY b ASC, a ASC, id ASC`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual(table_1.toArray)
  })

  it('multiple DESC', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1 },
        `SELECT * FROM table_1
         ORDER BY b DESC, a DESC, id DESC`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual(table_1.toArray.reverse())
  })
})
