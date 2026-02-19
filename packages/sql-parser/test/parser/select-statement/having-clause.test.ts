import { describe, it } from 'vitest'
import { strictParseSql } from '../../../src/index.ts'

describe('HAVING clause', () => {
  it('Should parse basic having', () => {
    strictParseSql(`
      SELECT COUNT(*) AS c
      FROM table
      GROUP BY row
      HAVING row >= 10
    `)
  })

  it('Should parse condition expression', () => {
    strictParseSql(`
      SELECT COUNT(*) AS c
      FROM table
      GROUP BY row
      HAVING row >= 10 AND row <= 100
    `)
  })

  it.skip('Should parse arithmetic expression', () => {
    strictParseSql(`
      SELECT *
      FROM table
      WHERE row1 = (1+1)/row2 
    `)
  })
})
