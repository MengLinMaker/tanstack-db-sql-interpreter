import { defaultSwitchExprError } from '../../../util/error.ts'
import type { Expression } from './expression.ts'

export const stringifyExpression = (expr: Expression): string => {
  switch (expr.type) {
    case 'function': {
      const name = expr.func.name
      const args = expr.args.map(stringifyExpression).join(', ')
      return `${name}(${args})`
    }
    case 'column':
      return `c.${expr.column.table}.${expr.column.column}`
    case 'literal':
      return stringifyLiteral(expr.value)
    case 'array': {
      return `[${expr.args.map((v) => stringifyExpression(v)).join(', ')}]`
    }
    default:
      throw defaultSwitchExprError(expr)
  }
}

const stringifyLiteral = (value: unknown) => {
  if (value === null) return 'null'
  if (typeof value === 'string') return `'${value.replaceAll("'", "''")}'`
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return `${value}`
  return `'${String(value)}'`
}
