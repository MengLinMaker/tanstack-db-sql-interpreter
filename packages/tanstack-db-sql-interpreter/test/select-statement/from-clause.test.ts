import { describe, expect, it } from 'vitest'
import { liveQuerySql } from '../../src/index.ts'
import { collectionProperties } from '../../src/util/collection.ts'
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
