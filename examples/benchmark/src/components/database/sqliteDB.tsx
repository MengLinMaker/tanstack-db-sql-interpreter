import { createContext } from 'solid-js'
import { SQLocal } from 'sqlocal'

const db = new SQLocal(`sqlite.benchmark.${new Date().toISOString()}.sqlite3`)

export const SqliteDB = createContext(db)
