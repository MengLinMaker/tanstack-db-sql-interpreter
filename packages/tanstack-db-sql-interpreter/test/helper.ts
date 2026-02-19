import {
  Context,
  createCollection,
  InitialQueryBuilder,
  liveQueryCollectionOptions,
  type QueryBuilder,
} from '@tanstack/db'

export const eagerLiveQueryCollection = (query: (q: InitialQueryBuilder) => QueryBuilder<Context>) =>
  createCollection(
    liveQueryCollectionOptions({
      query,
      startSync: true,
    }),
  )

export const testCollectionFactory = () =>
  createCollection({
    sync: {
      sync: () => { },
    },
    onInsert: async () => { },
    // @ts-expect-error just for make queries work
    getKey: (q) => q.id,
  })
