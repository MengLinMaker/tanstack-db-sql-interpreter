import {
  add,
  and,
  avg,
  coalesce,
  concat,
  count,
  eq,
  gt,
  gte,
  ilike,
  length,
  like,
  lower,
  lt,
  lte,
  max,
  min,
  not,
  or,
  sum,
  upper,
} from '@tanstack/db'

const expressionMap = {
  // FUNC_SINGLE
  UPPER__: upper,
  LOWER__: lower,
  LENGTH__: length,
  NOT__: not,
  COUNT__: count,
  SUM__: sum,
  AVG__: avg,
  MIN__: min,
  MAX__: max,
  // FUNC_MANY
  CONCAT__: concat,
  COALESCE__: coalesce,
  // OPERATOR
  EQUAL__: eq,
  GT__: gt,
  GTE__: gte,
  LT__: lt,
  LTE__: lte,
  IS__: eq,
  AND__: and,
  OR__: or,
  LIKE__: like,
  ILIKE__: ilike,
  PLUS__: add,
} as const

export const getExpressionMap = (key: keyof typeof expressionMap) =>
  expressionMap[key]
