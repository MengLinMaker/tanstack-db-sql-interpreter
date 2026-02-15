import { describe, it } from 'vitest'
import { strictParseSql } from '../../../src/index.ts'

describe('GROUP clause', () => {
  it('Should parse single row', () => {
    strictParseSql(`
      SELECT SUM(row1), AVG(row2), MIN(row3), MAX(row4)
      FROM table1
      GROUP BY row1
    `)
  })

  it('Should parse multiple row', () => {
    strictParseSql(`
      SELECT SUM(row1), AVG(row2), MIN(row3), MAX(row4)
      FROM table1
      GROUP BY row1, row2, row3, row4
    `)
  })
})
