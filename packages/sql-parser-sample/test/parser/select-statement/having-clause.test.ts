import { describe, it } from 'vitest'
import { parser } from '../../../src/index.ts'

describe('HAVING clause', () => {
  const strictParser = parser.configure({ strict: true })

  it('Should parse basic having', () => {
    strictParser.parse(`
      SELECT COUNT(*)
      FROM table
      GROUP BY row
      HAVING row >= 10
    `)
  })

  it('Should parse condition expression', () => {
    const source = `
      SELECT COUNT(*)
      FROM table
      GROUP BY row
      HAVING row >= 10 AND row <= 100
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
