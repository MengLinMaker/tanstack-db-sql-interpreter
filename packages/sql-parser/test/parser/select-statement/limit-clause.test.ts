import { describe, it } from 'vitest'
import { strictParseSql } from '../../../src/index.ts'

describe('LIMIT clause', () => {
  it('Should parse limit', () => {
    strictParseSql(`
      SELECT *
      FROM table1
      LIMIT 10
    `)
  })

  it('Should parse limit + offset', () => {
    strictParseSql(`
      SELECT *
      FROM table1
      LIMIT 10 OFFSET 10
    `)
  })
})
