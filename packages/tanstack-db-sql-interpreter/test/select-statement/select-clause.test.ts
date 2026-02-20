import { describe, expect, it } from 'vitest'
import { liveQuerySql } from '../../src/index.ts'
import { collectionProperties } from '../../src/util/collection.ts'
import { eagerLiveQueryCollection, testCollectionFactory } from '../helper.ts'

describe('SELECT clause', () => {
  const table_1 = testCollectionFactory()
  const table_2 = testCollectionFactory()
  const table_1_data = {
    id: 1,
    join_id: 3,
    post: 'hello',
  }
  const table_2_data = {
    id: 1,
    join_id: 3,
    other_join_id: 3,
    user: 'John',
  }
  const seedTables = () => {
    table_1.insert(table_1_data)
    table_2.insert(table_2_data)
  }

  it('table not found', () => {
    seedTables()
    expect(() => {
      eagerLiveQueryCollection(
        liveQuerySql(
          {
            table_1,
          },
          'SELECT * FROM table_2',
        ),
      )
    }).throw(`Table not found: 'table_2'`)
  })

  it('all', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql({ table_1, table_2 }, 'SELECT * FROM table_1'),
    )
    const properties = collectionProperties({ newCollection }, 'newCollection')
    expect(properties).toStrictEqual(Object.keys(table_1_data))
  })

  it('all ignore additional table', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql({ table_1, table_2 }, 'SELECT * FROM table_1'),
    )
    const properties = collectionProperties({ newCollection }, 'newCollection')
    expect(properties).toStrictEqual(Object.keys(table_1_data))
  })

  it('all table', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1, table_2 },
        `SELECT table_2.* FROM table_1
         JOIN table_2 USING(join_id)`,
      ),
    )
    const properties = collectionProperties({ newCollection }, 'newCollection')
    expect(properties).toStrictEqual(Object.keys(table_2_data))
  })

  it('column', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1, table_2 },
        `SELECT table_2.id FROM table_1
         JOIN table_2 USING(join_id)`,
      ),
    )
    const properties = collectionProperties({ newCollection }, 'newCollection')
    expect(properties).toStrictEqual(['id'])
  })

  it('column alias', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1, table_2 },
        `SELECT table_2.id as col FROM table_1
         JOIN table_2 USING(join_id)`,
      ),
    )
    const properties = collectionProperties({ newCollection }, 'newCollection')
    expect(properties).toStrictEqual(['col'])
  })

  describe('expression', () => {
    it('count alias', () => {
      seedTables()
      const newCollection = eagerLiveQueryCollection(
        liveQuerySql(
          { table_1, table_2 },
          `SELECT count(table_2.id) as col FROM table_1
           JOIN table_2 USING(join_id)`,
        ),
      )
      expect(newCollection.toArray).toStrictEqual([
        { col: newCollection.toArray.length },
      ])
    })

    it('count all alias', () => {
      seedTables()
      const newCollection = eagerLiveQueryCollection(
        liveQuerySql(
          { table_1, table_2 },
          `SELECT count(*) as col FROM table_1
           JOIN table_2 USING(join_id)`,
        ),
      )
      expect(newCollection.toArray).toStrictEqual([
        { col: newCollection.toArray.length },
      ])
    })

    it('expression sum', () => {
      seedTables()
      const newCollection = eagerLiveQueryCollection(
        liveQuerySql(
          { table_1 },
          `SELECT
            id + join_id as row
           FROM table_1`,
        ),
      )
      expect(newCollection.toArray[0]).toStrictEqual({
        row: table_1_data.id + table_1_data.join_id,
      })
    })

    it('expression concat numbers', () => {
      seedTables()
      const newCollection = eagerLiveQueryCollection(
        liveQuerySql(
          { table_1 },
          `SELECT
             CONCAT(id, '_', join_id, '_', post) as row
           FROM table_1`,
        ),
      )
      expect(newCollection.toArray[0]).toStrictEqual({
        row: Object.values(table_1_data).join('_'),
      })
    })

    it('expression complex expression', () => {
      seedTables()
      const newCollection = eagerLiveQueryCollection(
        liveQuerySql(
          { table_1 },
          `SELECT
             COALESCE(null, null, NOT( (id = join_id) < LENGTH(post) )) as row
           FROM table_1`,
        ),
      )
      expect(newCollection.toArray[0]).toStrictEqual({ row: false })
    })

    it('expression in array', () => {
      seedTables()
      const newCollection = eagerLiveQueryCollection(
        liveQuerySql(
          { table_1 },
          `SELECT
            id IN (join_id, 2,3,4,5,6) as row
           FROM table_1`,
        ),
      )
      expect(newCollection.toArray[0]).toStrictEqual({ row: false })
    })

    it('expression between', () => {
      seedTables()
      const newCollection = eagerLiveQueryCollection(
        liveQuerySql(
          { table_1 },
          `SELECT
            NOT(id BETWEEN 0 AND join_id) as row
           FROM table_1`,
        ),
      )
      expect(newCollection.toArray[0]).toStrictEqual({ row: false })
    })
  })
})
