import { connect } from '@tursodatabase/database-wasm/vite'
import { createContext } from 'solid-js'

const db = await connect(`turso.benchmark.${new Date().toISOString()}.db`, {
  timeout: 1000,
  // experimental: ['views'],
})

export const TursoDB = createContext(db)
