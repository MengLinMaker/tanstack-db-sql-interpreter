import { Tree, TreeCursor, type TreeFragment } from '@lezer/common'
import { parser } from '../src/grammar/parser.js'
import { describe, expect, it } from 'vitest'

function parse(text: string, fragments: TreeFragment[] = []) {
  const parse = parser.startParse(text, fragments)
  let result = null
  while (!result) {
    result = parse.advance()
  }
  return result
}

export function testNodes(text: string) {
  let cursor = parse(text)
  let errorNodeCount = 0

  if (!(cursor instanceof TreeCursor))
    cursor = cursor instanceof Tree ? cursor.cursor() : cursor.cursor

  for (;;) {
    if (cursor.type.isError === true) errorNodeCount += 1
    if (cursor.children) continue

    for (;;) {
      if (cursor.nextSibling()) break
      if (!cursor.parent()) return errorNodeCount
    }
  }
}

describe('Error node test', () => {
  it('Should return zero if the query is valid', () => {
    console.log('hello')
    expect(testNodes('drop table if exists foo cascade')).toBe(0)
  })
})
