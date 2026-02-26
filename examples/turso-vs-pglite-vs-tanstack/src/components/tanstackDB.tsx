// import type { Collections } from '@menglinmaker/tanstack-db-sql-interpreter'

// import { Collections } from '@menglinmaker/tanstack-db-sql-interpreter'
import type { Collection } from '@tanstack/db'
import { createContext } from 'solid-js'
import { collections } from '../schema/collections.ts'

type Collections = {
  [key: string]: Collection<any, any, any, any, any>
}

export const TanstackDB = createContext<Collections>(collections)
