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

  return rootNode as never as SQL
}

export const strictParseSql = (sql: string) => {
  try {
    const strictParser = parser.configure({ strict: true })
    const tree = strictParser.parse(sql)
    const ast = transformTree(tree, sql)
    return ast
  } catch (originalError) {
    if (originalError instanceof SyntaxError) {
      const match = originalError.message.match(/No parse at (\d+)/)
      if (match) {
        const position = Number.parseInt(match[1]!, 10)
        let line = 1
        let column = 1
        for (let i = 0; i < Math.min(position, sql.length); i++) {
          if (sql[i] === '\n') {
            line += 1
            column = 1
          } else {
            column += 1
          }
        }
        const enhancedError = new SyntaxError(
          `SQL parse error at line ${line}, column ${column}`,
        )
        ;(enhancedError as { cause?: unknown }).cause = originalError
        throw enhancedError
      }
    }
    throw originalError
  }
}
