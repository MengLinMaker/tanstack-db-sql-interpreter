import type * as Node from '../dist/treeType'
import { strictParseSql } from './parser/transformTree.ts'

export { strictParseSql }
export type { Node }
export type ChildrenName<T extends { children: { name: string }[] }> =
  T['children'][number]['name']
