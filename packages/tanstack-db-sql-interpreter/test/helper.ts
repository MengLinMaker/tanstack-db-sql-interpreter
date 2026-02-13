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
