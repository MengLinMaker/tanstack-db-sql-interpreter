import { parser } from '@lezer/lezer'
import {
  getRuleDeclarationNodes,
  getTypeInfoDeep,
  type TypeInfo,
} from './ruleNode.ts'
import ts from 'typescript'
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
    return generateChoiceNodeType(t)
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
 * Create choice node type
 *
 * ```TypeScript
 * export type NODE_NAME = {
 *    name: 'NODE_NAME'
 *    children: (NODE_1 | NODE_2)[]
 * }
 * ```
 */
const generateChoiceNodeType = (typeInfo: TypeInfo) =>
  nodeTypeBase(
    typeInfo,
    factory.createPropertySignature(
      undefined,
      factory.createIdentifier('children'),
      undefined,
      factory.createArrayTypeNode(
        factory.createParenthesizedType(
          factory.createUnionTypeNode(
            typeInfo.childrenName.map((name) =>
              factory.createTypeReferenceNode(factory.createIdentifier(name)),
            ),
          ),
        ),
      ),
    ),
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
  nodeTypeBase(
    typeInfo,
    factory.createPropertySignature(
      undefined,
      factory.createIdentifier('children'),
      undefined,
      factory.createTupleTypeNode(
        typeInfo.childrenName.map((name) =>
          factory.createTypeReferenceNode(factory.createIdentifier(name)),
        ),
      ),
    ),
  )

/**
 * Create leaf node type
 *
 * ```TypeScript
 * export type NODE_NAME = {
 *    name: 'NODE_NAME'
 *    vallue: string
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
