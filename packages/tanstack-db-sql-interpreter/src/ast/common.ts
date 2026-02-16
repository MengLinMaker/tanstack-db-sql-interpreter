import type { Node } from '@menglinmaker/sql-parser'
import { defaultSwitchNodeError } from '../error'
import {
  columnNotFoundCheck,
  findColumnFromTables,
} from '../helpers/collection'
import type { Collections } from '../types'

export const columnNode = (node: Node.COLUMN, collections: Collections) => {
  const n = node.children[0]
  switch (n.name) {
    case 'COLUMN_NAME__': {
      const column = n.value
      return findColumnFromTables(collections, column)
    }
    case 'TABLE_COLUMN_NAME': {
      const table = n.children[0].value
      const column = n.children[1].value
      columnNotFoundCheck(collections, table, column)
      return { table, column }
    }
    default:
      throw defaultSwitchNodeError(n)
  }
}
