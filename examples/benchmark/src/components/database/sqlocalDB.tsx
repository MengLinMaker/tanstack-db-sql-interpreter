import { createContext } from 'solid-js'
import { SQLocal } from 'sqlocal'

const db = new SQLocal(`sqlocal.benchmark.${new Date().toISOString()}sqlite3`)

export const SqlocalDB = createContext(db)
