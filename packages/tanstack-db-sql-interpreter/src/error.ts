export class LiveQuerySqlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LiveQuerySqlError'
  }
}

export const defaultSwitchNodeError = (node: never) =>
  // @ts-expect-error <intentionally use never type>
  new LiveQuerySqlError(`Node not covered by switch statement: ${node.name}`)
