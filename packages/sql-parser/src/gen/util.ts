import type { SyntaxNode } from '@lezer/common'

export const getNodeString = (node: SyntaxNode, doc: string) =>
  doc.slice(node.from, node.to)

export const isLowerCase = (str: string) => str === str.toLowerCase()
