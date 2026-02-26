import { PGlite } from '@electric-sql/pglite'
import { createContext } from 'solid-js'

const db = new PGlite()

export const PgliteDB = createContext(db)
