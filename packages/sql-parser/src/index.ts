import { parser } from '../dist/parser.js'
import type * as Node from '../dist/treeType'
import { transformTree } from './parser/transformTree.js'

export const strictParseSql = (sql: string) => {
  const strictParser = parser.configure({ strict: true })
  const tree = strictParser.parse(sql)

  const ast = transformTree(tree, sql)
  return ast
}

export type { Node }
export type ChildrenName<T extends { children: { name: string }[] }> =
  T['children'][number]['name']
