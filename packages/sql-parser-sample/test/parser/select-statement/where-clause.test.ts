import { describe, it } from 'vitest'
import { parser } from '../../../src/index.ts'

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
    const source = `
      SELECT *
      FROM table
      WHERE row1 = 1 AND NOT(row2 < 1 AND row3 > 1)
    `
    const t = strictParser.parse(source)
    t.iterate({
      enter: (n) => {
        if (n.name === 'TABLE') {
          const text = source.slice(n.from, n.to)
          console.log(text)
        }
      },
    })
  })

  it.skip('Should parse arithmetic expression', () => {
    strictParser.parse(`
      SELECT *
      FROM table
      WHERE row1 = (1+1)/row2 
    `)
  })
})
