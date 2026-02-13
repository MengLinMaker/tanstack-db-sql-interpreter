import { describe, expect, it } from 'vitest'
import { liveQuerySql } from '../src/liveQuerySql.ts'
import { createCollection } from '@tanstack/db'
import { collectionProperties } from '../src/helpers/collectionProperties.ts'
import { eagerLiveQueryCollection } from './helper.ts'

describe('Basic SQL', () => {
  const query_table_1 = createCollection({
    sync: {
      sync: () => {},
    },
    onInsert: async () => {},
    // @ts-expect-error just for make queries work
    getKey: (q) => q.id,
  })
  const query_table_2 = createCollection({
    sync: {
      sync: () => {},
    },
    onInsert: async () => {},
    // @ts-expect-error just for make queries work
    getKey: (q) => q.id,
  })

  it('SELECT table not found', () => {
    query_table_1.insert({ id: 1 })
    expect(() => {
      eagerLiveQueryCollection(
        liveQuerySql(
          {
            query_table_1,
          },
          'SELECT * FROM query_table_2',
        ),
      )
    }).throw(`'query_table_2' collection table cannot be found`)
  })

  it('SELECT basic', () => {
    const query_table_1_data = {
      id: 1,
      post: 'hello',
    }
    query_table_1.insert(query_table_1_data)
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        {
          query_table_1,
          query_table_2, // Query should ignore this collection
        },
        'SELECT * FROM query_table_1',
      ),
    )
    const properties = collectionProperties({ newCollection }, 'newCollection')
    expect(properties).toStrictEqual(Object.keys(query_table_1_data))
  })

  it('SELECT basic ignore additional table', () => {
    const query_table_1_data = {
      id: 1,
      post: 'hello',
    }
    query_table_1.insert(query_table_1_data)
    const newCollection = eagerLiveQueryCollection(
      liveQuerySql(
        {
          query_table_1,
          query_table_2, // Query should ignore this collection
        },
        'SELECT * FROM query_table_1',
      ),
    )
    const properties = collectionProperties({ newCollection }, 'newCollection')
    expect(properties).toStrictEqual(Object.keys(query_table_1_data))
  })
})
