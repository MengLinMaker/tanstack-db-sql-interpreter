import { createContext } from 'solid-js'
import { SQLocal } from 'sqlocal'

export const sqliteFactory = () => new SQLocal(':memory:')

export const SqliteDB = createContext(sqliteFactory())
