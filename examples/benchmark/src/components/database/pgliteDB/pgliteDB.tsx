import { PGlite } from '@electric-sql/pglite'
import { live, type PGliteWithLive } from '@electric-sql/pglite/live'
import { createContext } from 'solid-js'

export const pgliteFactory = () =>
  new PGlite('memory://', {
    extensions: {
      live,
    },
  }) as never as PGliteWithLive

export const PgliteDB = createContext<ReturnType<typeof pgliteFactory>>(
  pgliteFactory(),
)
