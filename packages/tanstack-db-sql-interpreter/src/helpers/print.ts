export const stringifyObject = (obj: object) =>
  JSON.stringify(obj)
    .replaceAll(`"`, '')
    .replaceAll('{', '{ ')
    .replaceAll('}', ' }')
    .replaceAll(',', ', ')
    .replaceAll(':', ': ')
