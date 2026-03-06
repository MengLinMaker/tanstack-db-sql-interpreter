export const formatTestError = (error: unknown) => {
  let message =
    error instanceof Error ? error.stack || error.message : String(error)
  if (
    error instanceof Error &&
    'cause' in error &&
    error.cause instanceof Error
  ) {
    const cause = error.cause
    message += `\n\nCaused by:\n${cause.stack || cause.message}`
  }
  return message
}
