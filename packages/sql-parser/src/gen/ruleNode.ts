import type { SyntaxNode, Tree } from '@lezer/common'
import { getNodeString, isLowerCase } from './util.ts'

export const getRuleDeclarationNodes = (tree: Tree) => {
  const nodes: SyntaxNode[] = []
  tree.iterate({
    enter(node) {
      if (node.name !== 'RuleDeclaration') return
      nodes.push(node.node)
    },
  })
  return nodes
}

export const getRuleNameAndBody = (
  ruleDeclarationNode: SyntaxNode,
  doc: string,
) => {
  // biome-ignore lint/style/noNonNullAssertion: <definitely not null>
  const node = ruleDeclarationNode.getChild('RuleName')!
  return {
    name: getNodeString(node, doc),
    // biome-ignore lint/style/noNonNullAssertion: <definitely not null>
    bodyNode: ruleDeclarationNode.getChild('Body')!,
  }
}

export type TypeInfo = {
  name: string
  childrenName: string[]
  onlyHasSequence: boolean
}

export const getTypeInfo = (ruleNode: SyntaxNode, slice: string) => {
  let typeInfos: TypeInfo[] = []

  const { name, bodyNode } = getRuleNameAndBody(ruleNode, slice)
  if (isLowerCase(name.slice(0, 1))) return typeInfos

  const typeInfo: TypeInfo = {
    name,
    childrenName: [],
    onlyHasSequence: true,
  }
  const bodyNodeSlice = getNodeString(bodyNode, slice)

  const onlyHasSquenceFilter = [
    'Sequence',
    '{',
    '}',
    'InlineRule',
    'RuleName',
    'Body',
  ]
  bodyNode.node.toTree().iterate({
    enter(node) {
      if (
        !onlyHasSquenceFilter.includes(node.name) &&
        !node.name.includes('__')
      )
        typeInfo.onlyHasSequence = false

      if (node.name === 'InlineRule') {
        const { name } = getRuleNameAndBody(node.node, bodyNodeSlice)
        typeInfo.childrenName.push(name)
        const inlineTypeInfos = getTypeInfo(node.node, bodyNodeSlice)
        typeInfos = typeInfos.concat(inlineTypeInfos)
        return false
      }

      if (node.name !== 'RuleName') return
      const name = getNodeString(node.node, bodyNodeSlice)
      if (isLowerCase(name.slice(0, 1))) return
      typeInfo.childrenName.push(name)
      return
    },
  })

  typeInfos.push(typeInfo)
  return typeInfos
}

/**
 * Recursively walk through RuleDeclaration and InlineRule to collect RuleName
 */
export const getTypeInfoDeep = (
  inputRuleNodes: SyntaxNode[],
  slice: string,
) => {
  const typeInfosList: TypeInfo[][] = []

  for (const ruleNode of inputRuleNodes) {
    typeInfosList.push(getTypeInfo(ruleNode, slice))
  }

  const typeInfos = Array.from<TypeInfo>([]).concat(...typeInfosList)
  return typeInfos
}
