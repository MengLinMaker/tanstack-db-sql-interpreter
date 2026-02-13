export class LiveQuerySqlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LiveQuerySqlError'
  }
}
