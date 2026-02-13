import { describe, expect, it } from 'vitest'
import { parseTanstackDbSql } from '../src/ast.ts'

describe('Illegal statements', () => {
  it('Should prevent incomplete SQL', () => {
    expect(() => {
      parseTanstackDbSql('SELECT')
    }).throw(
      'Expected "--", ".", "/*", ":=", ";", "=", "TO", "\\"", [ \\t\\n\\r], or [A-Za-z0-9_\\-$一-龥À-ſ] but end of input found.',
    )
  })

  it('Should prevent `CREATE`', () => {
    expect(() => {
      parseTanstackDbSql('CREATE DATABASE public')
    }).throw('CREATE is not supported in tanstack db')
  })

  it('Should prevent multiple queries', () => {
    expect(() => {
      parseTanstackDbSql(`
        SELECT * FROM query_table_1;
        SELECT * FROM query_table_2;
      `)
    }).throw('Cannot have multiple SQL queries')
  })
})

describe('Legal statements', () => {
  it('Should parse CTEs', () => {
    parseTanstackDbSql(`
      With temp_1 AS (
        SELECT * FROM query_table_1
      ),
      temp_2 AS (
        SELECT * FROM query_table_2
      )
      SELECT * FROM temp_1 lEFT JOIN temp_2 ON temp_2_id = temp_2.id
    `)
  })
})
