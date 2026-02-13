import { describe, it } from 'vitest'
import { parser } from '../../../src/index.ts'

describe('GROUP clause', () => {
  const strictParser = parser.configure({ strict: true })

  it('Should parse single row', () => {
    strictParser.parse(`
      SELECT SUM(row1), AVG(row2), MIN(row3), MAX(row4)
      FROM table1
      GROUP BY row1
    `)
  })

  it('Should parse multiple row', () => {
    strictParser.parse(`
      SELECT SUM(row1), AVG(row2), MIN(row3), MAX(row4)
      FROM table1
      GROUP BY row1, row2, row3, row4
    `)
  })
})
