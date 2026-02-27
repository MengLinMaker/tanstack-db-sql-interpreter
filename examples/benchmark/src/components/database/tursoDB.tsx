import { connect } from '@tursodatabase/database-wasm/vite'
import { createContext } from 'solid-js'

export const tursoFactory = async () =>
  await connect(`:memory:`, {
    timeout: 1000,
    // experimental: ['views'],
  })

export const TursoDB = createContext(await tursoFactory())
