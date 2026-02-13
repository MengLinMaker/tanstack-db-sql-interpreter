import type { Context, QueryBuilder } from '@tanstack/db'
import { parseTanstackDbSql } from '@menglinmaker/sql-parser'
import type { InitialQueryBuilder } from '@tanstack/db'
import { LiveQuerySqlError } from './error'
import type { Collections } from './types'
import { selectAll } from './query/selectAll'
import { collectionsFilter } from './helpers/collectionsFilter'

export const liveQuerySql = (collections: Collections, sql: string) => {
  const ast = parseTanstackDbSql(sql)

  const queryBuilder = (q: InitialQueryBuilder) => {
    let query = q

    if (!ast.from) throw new LiveQuerySqlError('Cannot interpret: FROM null')
    if (Array.isArray(ast.from)) {
      console.log(ast.columns[0].expr.column)
      // @ts-expect-error rip
      const tableName = ast.from[0]!.table

      const fromCollections = collectionsFilter(collections, [tableName])
      const selectCollections = collectionsFilter(collections, [tableName])
      query = query
        .from(fromCollections)
        .select((q) => selectAll(selectCollections, q)) as never
    } else {
      ast.from.expr
    }

    return query
  }
  return queryBuilder as never as QueryBuilder<Context>
}
