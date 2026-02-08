import { describe, it } from 'vitest'
import { parser } from '../../src/grammar/parser.js'
import { fileTests } from '@lezer/generator/test'
import path from 'node:path'
import { readFileSync } from 'node:fs'

describe('SELECT statements', () => {
  const fileName = './select.txt'

  const filePath = path.join(import.meta.dirname, fileName)
  const fileContent = readFileSync(filePath, 'utf8')
  for (const test of fileTests(fileContent, fileName)) {
    console.log(test.name)

    it(`Should compile ${fileName} ${test.name}`, () => {
      console.log(test.name)
      test.run(parser)
    })
  }
})
