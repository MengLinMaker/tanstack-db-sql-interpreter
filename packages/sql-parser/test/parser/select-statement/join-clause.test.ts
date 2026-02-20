import { describe, it } from 'vitest'
import { strictParseSql } from '../../../src/index.ts'

describe('JOIN clause', () => {
  it('Should parse join using()', () => {
    strictParseSql(`
      SELECT *
      FROM table1
      JOIN table2 USING (table2_id)
    `)
  })

  it('Should parse join on', () => {
    strictParseSql(`
      SELECT *
      FROM table1
      JOIN table2 ON id = table1.id
    `)
  })

  it('Should parse table alias', () => {
    strictParseSql(`
      SELECT a.id, b.id
      FROM table1 a
      JOIN table2 b USING (id)
    `)
  })
})
