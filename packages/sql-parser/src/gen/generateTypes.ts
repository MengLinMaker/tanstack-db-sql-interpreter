import { parser } from '@lezer/lezer'
import ts from 'typescript'
import {
  getRuleDeclarationNodes,
  getTypeInfoDeep,
  type TypeInfo,
} from './ruleNode.ts'

const { createPrinter, factory, SyntaxKind } = ts

export const generateTypes = (grammar: string) => {
  const strictParser = parser.configure({ strict: true })
  const tree = strictParser.parse(grammar)

  const ruleNodes = getRuleDeclarationNodes(tree)
  const typeInfos = getTypeInfoDeep(ruleNodes, grammar)

  // Generate typescript according to - https://ts-ast-viewer.com/
  const typescriptAst = typeInfos.map((t) => {
    if (t.childrenName.length === 0) return generateLeafNodeType(t)
    if (t.onlyHasSequence) return generateSequenceNodeType(t)
    if (t.onlyHasChoice) return generateChoiceNodeType(t)
    return generateGenericNodeType(t)
  })

  const fileNode = ts.createSourceFile('', '', ts.ScriptTarget.Latest)
  const tsContent = createPrinter().printList(
    ts.ListFormat.MultiLine,
    factory.createNodeArray(typescriptAst),
    fileNode,
  )
  return tsContent
}

/**
 * Create generic node type
 *
 * ```TypeScript
 * export type NODE_NAME = {
 *    name: 'NODE_NAME'
 *    children: (NODE_1 | NODE_2)[]
 * }
 * ```
 */
const generateGenericNodeType = (typeInfo: TypeInfo) =>
  nodeTypeChildrenBase(
    typeInfo,
    factory.createArrayTypeNode(
      factory.createParenthesizedType(
        factory.createUnionTypeNode(
          typeInfo.childrenName.map((name) =>
            factory.createTypeReferenceNode(factory.createIdentifier(name)),
          ),
        ),
      ),
    ),
  )

/**
 * Create choice node type
 *
 * ```TypeScript
 * export type NODE_NAME = {
 *    name: 'NODE_NAME'
 *    children: [NODE_1 | NODE_2]
 * }
 * ```
 */
const generateChoiceNodeType = (typeInfo: TypeInfo) =>
  nodeTypeChildrenBase(
    typeInfo,
    factory.createTupleTypeNode([
      factory.createUnionTypeNode(
        typeInfo.childrenName.map((name) =>
          factory.createTypeReferenceNode(factory.createIdentifier(name)),
        ),
      ),
    ]),
  )

/**
 * Create sequence node type
 *
 * ```TypeScript
 * export type NODE_NAME = {
 *    name: 'NODE_NAME'
 *    children: [NODE_1, NODE_2]
 * }
 * ```
 */
const generateSequenceNodeType = (typeInfo: TypeInfo) =>
  nodeTypeChildrenBase(
    typeInfo,
    factory.createTupleTypeNode(
      typeInfo.childrenName.map((name) =>
        factory.createTypeReferenceNode(factory.createIdentifier(name)),
      ),
    ),
  )

/**
 * Create leaf node type
 *
 * ```TypeScript
 * export type NODE_NAME = {
 *    name: 'NODE_NAME'
 *    value: string
 * }
 * ```
 */
const generateLeafNodeType = (typeInfo: TypeInfo) =>
  nodeTypeBase(
    typeInfo,
    factory.createPropertySignature(
      undefined,
      factory.createIdentifier('value'),
      undefined,
      factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
    ),
  )

/**
 * Abstract node with children boilerplate
 *
 * ```TypeScript
 * export type NODE_NAME = {
 *    name: 'NODE_NAME'
 *    children: ...
 * }
 * ```
 */
const nodeTypeChildrenBase = (typeInfo: TypeInfo, typeNode: ts.TypeNode) =>
  nodeTypeBase(
    typeInfo,
    factory.createPropertySignature(
      undefined,
      factory.createIdentifier('children'),
      undefined,
      typeNode,
    ),
  )

/**
 * Abstracts node creation boilerplate
 *
 * ```TypeScript
 * export type NODE_NAME = {
 *    name: 'NODE_NAME'
 *    ... // typeElement
 * }
 * ```
 * @param typeElement factory.createPropertySignature(...)
 */
const nodeTypeBase = (typeInfo: TypeInfo, typeElement: ts.TypeElement) =>
  factory.createTypeAliasDeclaration(
    [factory.createToken(SyntaxKind.ExportKeyword)],
    factory.createIdentifier(typeInfo.name),
    undefined,
    factory.createTypeLiteralNode([
      factory.createPropertySignature(
        undefined,
        factory.createIdentifier('name'),
        undefined,
        factory.createLiteralTypeNode(
          factory.createStringLiteral(typeInfo.name),
        ),
      ),
      typeElement,
    ]),
  )
