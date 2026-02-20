import { describe, expect, it } from 'vitest'
import { liveQuerySql } from '../../src/index.ts'
import { eagerLiveQueryCollection, testCollectionFactory } from '../helper.ts'

describe('HAVING clause', () => {
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

  it('true', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1 },
        `SELECT *
         FROM table_1
         GROUP BY id, a, b
         HAVING true = true`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual(table_1.toArray)
  })

  it('false', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1 },
        `SELECT *
         FROM table_1
         GROUP BY id, a, b
         HAVING true = false`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual([])
  })

  it('single column expression', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1 },
        `SELECT id, AVG(a) as a, AVG(b) as b
         FROM table_1
         GROUP BY id
         HAVING AVG(a) = 0`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual(table_1.toArray.slice(0, 2))
  })

  it('multiple column expression', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1 },
        `SELECT id, AVG(a) as a, AVG(b) as b
         FROM table_1
         GROUP BY id
         HAVING (AVG(a) = 0) AND (AVG(b) = 0)`,
      ),
    )
    expect(newCollection.toArray).toStrictEqual(table_1.toArray.slice(0, 2))
  })
})
