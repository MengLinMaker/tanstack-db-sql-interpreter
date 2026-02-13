import { describe, expect, it } from 'vitest'
import { parser } from '../../src/index.ts'

describe('Error node test', () => {
  it.sequential('Should parse invalid input on non-strict mode', () => {
    const looseParser = parser.configure({ strict: false })
    looseParser.parse(`DROP INDEX my_idx;`)
  })

  it.sequential('Should fail invalid input on strict mode', () => {
    const strictParser = parser.configure({ strict: true })
    expect(() => {
      strictParser.parse(`DROP INDEX my_idx;`)
    }).throw('No parse at 0')
  })
})
