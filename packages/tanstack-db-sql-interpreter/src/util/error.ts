export class LiveQuerySqlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LiveQuerySqlError'
  }
}

export const defaultSwitchNodeError = (node: never) =>
  new LiveQuerySqlError(
    `Node case not covered by switch statement: ${JSON.stringify(node, null, 2)}`,
  )

export const defaultSwitchExprError = (expr: never) =>
  new LiveQuerySqlError(
    `Expr case not covered by switch statement: ${JSON.stringify(expr, null, 2)}`,
  )
