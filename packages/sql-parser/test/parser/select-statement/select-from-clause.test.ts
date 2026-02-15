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
      SELECT COUNT(table1), SUM(row1), AVG(row2), MIN(row3), MAX(row4)
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
