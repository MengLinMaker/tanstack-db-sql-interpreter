import { describe, it } from 'vitest'
import { strictParseSql } from '../../src/index.ts'

describe('CTE', () => {
  it('Should parse single row', () => {
    strictParseSql(`
      WITH table_2 AS (
        SELECT * FROM table_1
      ),
      table_3 AS (
        SELECT * FROM table_2 
      )
      SELECT * FROM table_3
    `)
  })
})
