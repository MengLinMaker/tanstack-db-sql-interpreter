import type { Tree, TreeCursor } from '@lezer/common'
import { parser } from '../../dist/parser'
import type { SQL } from './../../dist/treeType'

type Node = {
  name: string
  value: null | string
  children: Node[]
}

const hasChildren = (cursor: TreeCursor) => {
  if (cursor.firstChild()) {
    // Has children. Remember to go back up the tree if you were just checking!
    cursor.parent()
    return true
  }
  return false
}

/**
 * Transforms a Lezer Tree into a custom JSON structure.
 * @param {Tree} tree The Lezer syntax tree.
 * @param {string} inputText The original input string.
 * @returns {object} The custom tree structure.
 */
const transformTree = (tree: Tree, inputText: string) => {
  // Manage navigation
  const stack: Node[] = []
  let rootNode: Node = null as never

  tree.iterate({
    enter: (n) => {
      const notLeafNode = hasChildren(n.node.cursor())
      const newNode = {
        name: n.type.name,
        value: notLeafNode ? null : inputText.substring(n.from, n.to),
        children: [],
      }

      if (stack.length === 0) {
        rootNode = newNode
      } else {
        stack[stack.length - 1]!.children.push(newNode)
      }
      stack.push(newNode)
    },
    leave: (_n) => stack.pop(),
  })

  return rootNode as SQL
}

export const strictParseSql = (sql: string) => {
  const strictParser = parser.configure({ strict: true })
  const tree = strictParser.parse(sql)

  const ast = transformTree(tree, sql)
  return ast
}
