import { describe, it } from 'vitest'
import { strictParseSql } from '../../../src/index.ts'

describe('SELECT FROM clause', () => {
  it('Should be case insensitive', () => {
    const sql = `SELECT * FROM table1`
    strictParseSql(sql.toUpperCase())
    strictParseSql(sql.toLowerCase())
  })

  it('Should parse columns', () => {
    strictParseSql(`
      SELECT *, table1.*, col1, table.col2
      FROM table1
    `)
  })

  it('Should parse aggregate', () => {
    strictParseSql(`
      SELECT COUNT(table1) AS c, SUM(row1) AS r1, AVG(row2) AS r2, MIN(row3) AS r3, MAX(row4) AS r4
      FROM table1
    `)
  })

  it('Should parse table alias', () => {
    strictParseSql(`
      SELECT a.id
      FROM my_table a
    `)
  })
})
