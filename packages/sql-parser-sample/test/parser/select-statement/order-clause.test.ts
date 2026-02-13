import { describe, it } from 'vitest'
import { parser } from '../../../src/index.ts'

describe('ORDER clause', () => {
  const strictParser = parser.configure({ strict: true })

  it('Should parse order row', () => {
    strictParser.parse(`
      SELECT *
      FROM table
      ORDER BY id
    `)
  })

  it('Should parse order table.row', () => {
    strictParser.parse(`
      SELECT *
      FROM table
      ORDER BY id
    `)
  })

  it('Should parse order ASC', () => {
    strictParser.parse(`
      SELECT *
      FROM table
      ORDER BY id ASC
    `)
  })

  it('Should parse order DESC', () => {
    strictParser.parse(`
      SELECT *
      FROM table
      ORDER BY id DESC
    `)
  })

  it('Should parse multiple', () => {
    strictParser.parse(`
      SELECT *
      FROM table
      ORDER BY row1, row2 ASC, row3 DESC
    `)
  })
})
