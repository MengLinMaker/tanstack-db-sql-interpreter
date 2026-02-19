export const stringifyObject = (obj: object) =>
  JSON.stringify(obj)
    .replaceAll(`"`, '')
    .replaceAll('{', '{ ')
    .replaceAll('}', ' }')
    .replaceAll(',', ', ')
    .replaceAll(':', ': ')

export const stringifyObjectMulti = (obj: object) =>
  JSON.stringify(obj, null, 2).replaceAll('"', '').replaceAll('\n', '\n ')
