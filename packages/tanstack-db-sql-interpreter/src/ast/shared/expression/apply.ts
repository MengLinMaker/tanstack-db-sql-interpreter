import type { BaseQueryBuilder } from '@tanstack/db'
import { defaultSwitchExprError } from '../../../util/error.ts'
import type { Expression } from './expression.ts'

export const applyExpression = (
  expr: Expression,
  c: Parameters<Parameters<BaseQueryBuilder['select']>[number]>[number],
) => {
  switch (expr.type) {
    case 'function': {
      const args = expr.args.map((arg) => applyExpression(arg, c))
      // @ts-expect-error override for convenience
      return expr.func(...args)
    }
    case 'column':
      return c[expr.column.table]![expr.column.column]
    case 'literal':
      return expr.value
    case 'array':
      return expr.args.map((e) => applyExpression(e, c))
    default:
      throw defaultSwitchExprError(expr)
  }
}
