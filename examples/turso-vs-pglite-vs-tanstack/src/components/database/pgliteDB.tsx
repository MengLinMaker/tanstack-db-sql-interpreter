import { PGlite } from '@electric-sql/pglite'
import { live, type PGliteWithLive } from '@electric-sql/pglite/live'
import { createContext } from 'solid-js'

const db = new PGlite({
  extensions: {
    live,
  },
}) as never as PGliteWithLive

export const PgliteDB = createContext(db)
