import {
  type Context,
  createCollection,
  liveQueryCollectionOptions,
  type QueryBuilder,
} from '@tanstack/db'

export const eagerLiveQueryCollection = (query: QueryBuilder<Context>) =>
  createCollection(
    liveQueryCollectionOptions({
      query,
      startSync: true,
    }),
  )

export const testCollectionFactory = () =>
  createCollection({
    sync: {
      sync: () => {},
    },
    onInsert: async () => {},
    // @ts-expect-error just for make queries work
    getKey: (q) => q.id,
  })
