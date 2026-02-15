import { describe, it } from 'vitest'
import { parser } from '../../../dist/parser.js'

describe('WHERE clause', () => {
  const strictParser = parser.configure({ strict: true })

  it('Should parse basic where', () => {
    strictParser.parse(`
      SELECT *
      FROM table
      WHERE row = 1
    `)
  })

  it('Should parse condition expression', () => {
    strictParser.parse(`
      SELECT *
      FROM table
      WHERE row1 = 1 AND NOT(row2 < 1 AND row3 > 1)
    `)
  })

  it.skip('Should parse arithmetic expression', () => {
    strictParser.parse(`
      SELECT *
      FROM table
      WHERE row1 = (1+1)/row2 
    `)
  })
})
