import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { generateTypes } from './gen/generateTypes.ts'
import { lezer } from '@lezer/generator/rollup'
import { rollup } from 'rollup'

const grammarFilePath = path.join(import.meta.dirname, './grammar/sql.grammar')

// Clean ./dist folder
const distFolder = path.join(import.meta.dirname, '../dist')
rmSync(distFolder, { recursive: true, force: true })
mkdirSync(distFolder)

// Generate grammar parser
const parserFilePath = path.join(import.meta.dirname, '../dist/parser.js')
const bundle = await rollup({
  input: grammarFilePath,
  plugins: [lezer()],
  external: ['@lezer/lr'],
})
await bundle.write({ file: parserFilePath, format: 'esm' })

// Generate typescript files
const grammar = readFileSync(grammarFilePath).toString()
const tsContent = generateTypes(grammar)
const tsFilePath = path.join(import.meta.dirname, '../dist/treeType.ts')
writeFileSync(tsFilePath, tsContent)
