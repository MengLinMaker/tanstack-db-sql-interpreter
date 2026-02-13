import type { Collection, StandardSchema, UtilsRecord } from '@tanstack/db'

export type Collections = {
  [key: string]: Collection<
    Record<string, any>,
    any,
    UtilsRecord,
    StandardSchema<any>,
    Record<string, any>
  >
}
