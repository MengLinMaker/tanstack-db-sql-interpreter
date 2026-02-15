import { parser } from '../dist/parser.js'
import { transformTree } from './parser/transformTree.js'

export const strictParseSql = (sql: string) => {
  const strictParser = parser.configure({ strict: true })
  const tree = strictParser.parse(sql)

  const ast = transformTree(tree, sql)
  return ast
}
