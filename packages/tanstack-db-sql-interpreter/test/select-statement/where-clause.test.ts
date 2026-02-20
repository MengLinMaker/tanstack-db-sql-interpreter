import { describe, expect, it } from 'vitest'
import { liveQuerySql } from '../../src/index.ts'
import { eagerLiveQueryCollection, testCollectionFactory } from '../helper.ts'

describe('WHERE clause', () => {
  const table = testCollectionFactory()
  const seedTables = () => {
    const data = [...Array(6).keys()].map((n) => ({
      id: n,
      a: Math.floor(n / 2),
      b: Math.floor(n / 3),
    }))
    data.map((d) => table.insert(d))
    return data
  }

  it('basic 1', () => {
    const data = seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table },
        `SELECT * FROM table
         WHERE a >= b`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual(data)
  })

  it('basic 2', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table },
        `SELECT * FROM table
         WHERE a < b`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual([])
  })

  it('basic expression 1', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table },
        `SELECT * FROM table
         WHERE NOT(a >= b)`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual([])
  })

  it('basic expression 2', () => {
    const data = seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table },
        `SELECT * FROM table
         WHERE NOT(a < b)`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual(data)
  })

  it('basic expression 3', () => {
    const data = seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table },
        `SELECT * FROM table
         WHERE NOT(a + b > 0)`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual(data.slice(0, 2))
  })
})
