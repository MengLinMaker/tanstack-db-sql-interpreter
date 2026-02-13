import { describe, expect, it } from 'vitest'
import { parser } from '../../../src/index.ts'

describe('SELECT FROM clause', () => {
  const strictParser = parser.configure({ strict: true })

  it('Should be case insensitive', () => {
    const sql = `SELECT * FROM table1`
    const lowerCaseTree = strictParser.parse(sql.toUpperCase())
    const upperCaseTree = parser.parse(sql.toLowerCase())
    expect(lowerCaseTree).toStrictEqual(upperCaseTree)
  })

  it('Should parse columns', () => {
    strictParser.parse(`
      SELECT *, table1.*, col1, table.col2
      FROM table1
    `)
  })

  it('Should parse aggregate', () => {
    strictParser.parse(`
      SELECT COUNT(table1), SUM(row1), AVG(row2), MIN(row3), MAX(row4)
      FROM table1
    `)
  })

  it('Should parse table alias', () => {
    strictParser.parse(`
      SELECT a.id
      FROM my_table a
    `)
  })
})
