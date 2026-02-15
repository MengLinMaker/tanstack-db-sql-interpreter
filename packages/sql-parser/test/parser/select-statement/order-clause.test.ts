import { describe, it } from 'vitest'
import { strictParseSql } from '../../../src/index.ts'

describe('ORDER clause', () => {
  it('Should parse order row', () => {
    strictParseSql(`
      SELECT *
      FROM table
      ORDER BY id
    `)
  })

  it('Should parse order table.row', () => {
    strictParseSql(`
      SELECT *
      FROM table
      ORDER BY id
    `)
  })

  it('Should parse order ASC', () => {
    strictParseSql(`
      SELECT *
      FROM table
      ORDER BY id ASC
    `)
  })

  it('Should parse order DESC', () => {
    strictParseSql(`
      SELECT *
      FROM table
      ORDER BY id DESC
    `)
  })

  it('Should parse multiple', () => {
    strictParseSql(`
      SELECT *
      FROM table
      ORDER BY row1, row2 ASC, row3 DESC
    `)
  })
})
