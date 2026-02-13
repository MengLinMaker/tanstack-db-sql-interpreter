import { describe, it } from 'vitest'
import { parser } from '../../../src/index.ts'

describe('JOIN clause', () => {
  const strictParser = parser.configure({ strict: true })

  it('Should parse join using()', () => {
    strictParser.parse(`
      SELECT *
      FROM table1
      JOIN table2 USING (table2_id)
    `)
  })

  it('Should parse join on', () => {
    strictParser.parse(`
      SELECT *
      FROM table1
      JOIN table2 ON id = table1.id
    `)
  })

  it('Should parse table alias', () => {
    strictParser.parse(`
      SELECT a.id, b.id
      FROM table1 a
      JOIN table2 b USING (id);
    `)
  })
})
