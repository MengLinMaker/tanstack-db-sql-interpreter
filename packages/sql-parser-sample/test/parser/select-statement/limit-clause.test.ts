import { describe, it } from 'vitest'
import { parser } from '../../../src/index.ts'

describe('LIMIT clause', () => {
  const strictParser = parser.configure({ strict: true })

  it('Should parse limit', () => {
    strictParser.parse(`
      SELECT *
      FROM table1
      LIMIT 10
    `)
  })

  it('Should parse limit + offset', () => {
    strictParser.parse(`
      SELECT *
      FROM table1
      LIMIT 10 OFFSET 10
    `)
  })
})
