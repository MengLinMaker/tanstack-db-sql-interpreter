import { describe, expect, it } from 'vitest'
import { collectionProperties } from '../../src/helpers/collection.ts'
import { liveQuerySql } from '../../src/liveQuerySql.ts'
import { eagerLiveQueryCollection, testCollectionFactory } from '../helper.ts'

describe('FROM clause', () => {
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

  it('SELECT basic', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql({ table_1, table_2 }, 'SELECT * FROM table_1'),
    )
    const properties = collectionProperties({ newCollection }, 'newCollection')
    expect(properties).toStrictEqual(Object.keys(table_1_data))
  })

  it('SELECT basic ignore additional table', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql({ table_1, table_2 }, 'SELECT * FROM table_1'),
    )
    const properties = collectionProperties({ newCollection }, 'newCollection')
    expect(properties).toStrictEqual(Object.keys(table_1_data))
  })

  it('JOIN USING column not found', () => {
    seedTables()
    expect(() => {
      eagerLiveQueryCollection(
        liveQuerySql(
          { table_1, table_2 },
          `SELECT * FROM table_1
          JOIN table_2 USING(identical)`,
        ),
      )
    }).throw(`Column not found: 'table_2.identical'`)
  })

  it('JOIN USING', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1, table_2 },
        `SELECT * FROM table_1
        JOIN table_2 USING(join_id)`,
      ),
    )
    const properties = collectionProperties({ newCollection }, 'newCollection')
    expect(properties).toStrictEqual(
      Object.keys({ ...table_1_data, ...table_2_data }),
    )
  })

  it('JOIN USING alias', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        { table_1, table_2 },
        `SELECT * FROM table_1
        JOIN table_2 alias_2 USING(join_id)`,
      ),
    )
    const properties = collectionProperties({ newCollection }, 'newCollection')
    expect(properties).toStrictEqual(
      Object.keys({ ...table_1_data, ...table_2_data }),
    )
  })

  it('JOIN ON additional table', () => {
    seedTables()
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        {
          table_1,
          table_2,
        },
        `SELECT * FROM table_1
        JOIN table_2 ON other_join_id = join_id`,
      ),
    )
    const properties = collectionProperties({ newCollection }, 'newCollection')
    expect(properties).toStrictEqual(
      Object.keys({ ...table_1_data, ...table_2_data }),
    )
  })
})
