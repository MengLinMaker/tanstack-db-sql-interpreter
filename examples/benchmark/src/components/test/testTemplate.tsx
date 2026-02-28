import {
  type CellContext,
  type ColumnDef,
  createSolidTable,
  flexRender,
  getCoreRowModel,
} from '@tanstack/solid-table'
import { createMemo, createSignal, For, Show } from 'solid-js'

const VIRTUALIZE_THRESHOLD = 1000
const ROW_HEIGHT_REM = 2.0
const VIEWPORT_HEIGHT_REM = 22.0
const OVERSCAN = 12

type RowObject = Record<string, unknown>

export type QueryResultPayload = {
  rows: unknown[]
  columns?: string[]
}

export function TestTemplate(props: {
  title: string
  subtitle?: string
  isRunning: boolean
  isFinished: boolean
  hasError: boolean
  onStart: () => void
  onShowResults: () =>
    | Promise<string | QueryResultPayload>
    | string
    | QueryResultPayload
  onShowError: () => Promise<string> | string
  rows: {
    label: string
    value: string
    barPercent?: number
  }[]
}) {
  let dialog: HTMLDialogElement | undefined
  let errorDialog: HTMLDialogElement | undefined

  const [resultText, setResultText] = createSignal('')
  const [errorText, setErrorText] = createSignal('')
  const [resultRows, setResultRows] = createSignal<RowObject[] | null>(null)
  const [resultColumns, setResultColumns] = createSignal<string[]>([])
  const [scrollTop, setScrollTop] = createSignal(0)
  const [columnSizing, setColumnSizing] = createSignal<Record<string, number>>(
    {},
  )

  const normalizeResultRows = (payload: QueryResultPayload) => {
    const sourceRows = payload.rows ?? []

    if (payload.columns && payload.columns.length > 0) {
      const normalizedRows = sourceRows.map((row) => {
        if (Array.isArray(row)) {
          const out: RowObject = {}
          payload.columns!.forEach((column, index) => {
            out[column] = row[index] ?? null
          })
          return out
        }
        if (row && typeof row === 'object') {
          return row as RowObject
        }
        return { value: row }
      })
      return { columns: payload.columns, rows: normalizedRows }
    }

    const normalizedRows = sourceRows.map((row) =>
      row && typeof row === 'object' ? (row as RowObject) : { value: row },
    )

    const inferredColumns =
      normalizedRows.length > 0 ? Object.keys(normalizedRows[0] ?? {}) : []

    return { columns: inferredColumns, rows: normalizedRows }
  }

  const columnDefs = createMemo<ColumnDef<RowObject>[]>(() =>
    resultColumns().map((column) => ({
      id: column,
      accessorFn: (row) => row[column],
      header: column,
      size: 160,
      cell: (context: CellContext<RowObject, unknown>) =>
        String(context.getValue() ?? ''),
    })),
  )

  const table = createSolidTable({
    get data() {
      return resultRows() ?? []
    },
    get columns() {
      return columnDefs()
    },
    state: {
      get columnSizing() {
        return columnSizing()
      },
    },
    onColumnSizingChange: (updater) => {
      setColumnSizing((prev) =>
        typeof updater === 'function' ? updater(prev) : updater,
      )
    },
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
  })

  const allRows = createMemo(() => table.getRowModel().rows)
  const rowCount = createMemo(() => allRows().length)
  const shouldVirtualize = createMemo(() => rowCount() >= VIRTUALIZE_THRESHOLD)

  const virtualStart = createMemo(() => {
    if (!shouldVirtualize()) return 0
    const rowHeightPx = ROW_HEIGHT_REM * 16
    return Math.max(0, Math.floor(scrollTop() / rowHeightPx) - OVERSCAN)
  })

  const virtualCount = createMemo(() => {
    if (!shouldVirtualize()) return rowCount()
    const rowHeightPx = ROW_HEIGHT_REM * 16
    const viewportPx = VIEWPORT_HEIGHT_REM * 16
    return Math.ceil(viewportPx / rowHeightPx) + OVERSCAN * 2
  })

  const visibleRows = createMemo(() => {
    if (!shouldVirtualize()) return allRows()
    const start = virtualStart()
    const count = virtualCount()
    return allRows().slice(start, start + count)
  })

  const topPaddingRem = createMemo(() => virtualStart() * ROW_HEIGHT_REM)
  const bottomPaddingRem = createMemo(() => {
    const rest = rowCount() - virtualStart() - visibleRows().length
    return Math.max(0, rest) * ROW_HEIGHT_REM
  })

  const leafColumnCount = createMemo(() => {
    const count = table.getAllLeafColumns().length
    return Math.max(1, count)
  })

  const openResults = async () => {
    const result = await props.onShowResults()
    if (!dialog) return

    if (typeof result === 'string') {
      setResultText(result)
      setResultRows(null)
      setResultColumns([])
    } else {
      const normalized = normalizeResultRows(result)
      setResultText('')
      setResultRows(normalized.rows)
      setResultColumns(normalized.columns)
    }

    setScrollTop(0)
    dialog.showModal()
  }

  const openError = async () => {
    const result = await props.onShowError()
    if (!errorDialog) return
    setErrorText(result)
    errorDialog.showModal()
  }

  return (
    <div class="test">
      <h2>{props.title}</h2>
      <div class="test-actions">
        {props.hasError ? (
          <button
            type="button"
            class="button-error"
            onClick={() => void openError()}
          >
            View error
          </button>
        ) : !props.isRunning && !props.isFinished ? (
          <button type="button" onClick={props.onStart}>
            Start test
          </button>
        ) : (
          <button type="button" onClick={() => void openResults()}>
            View query results
          </button>
        )}
      </div>
      <table>
        <tbody>
          {props.rows.map((row) => (
            <tr>
              <td>{row.label}</td>
              {row.barPercent === undefined ? (
                <td>{row.value}</td>
              ) : (
                <td
                  class="usage-cell"
                  style={{ '--bar-width': `${row.barPercent}%` }}
                >
                  {row.value}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <dialog ref={dialog} class="result-dialog">
        <div class="dialog-header">
          <h3>Query results</h3>
          <button type="button" onClick={() => dialog?.close()}>
            Close
          </button>
        </div>
        <p class="dialog-meta">Rows: {rowCount()}</p>

        <Show
          when={resultRows() !== null}
          fallback={<pre class="dialog-body">{resultText()}</pre>}
        >
          <div
            class="dialog-body"
            style={{
              'max-height': `${VIEWPORT_HEIGHT_REM}rem`,
              'overflow-y': 'scroll',
              'overflow-x': 'scroll',
              'max-width': '100%',
            }}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          >
            <table
              style={{
                width: 'max-content',
                'min-width': '100%',
                'border-collapse': 'collapse',
              }}
            >
              <thead>
                <For each={table.getHeaderGroups()}>
                  {(headerGroup) => (
                    <tr>
                      <For each={headerGroup.headers}>
                        {(header) => (
                          <th
                            style={{
                              position: 'sticky',
                              top: '0',
                              'text-align': 'left',
                              'white-space': 'nowrap',
                              background: 'var(--card-bg, #fff)',
                              'z-index': '1',
                              width: `${header.getSize()}px`,
                              'min-width': `${header.getSize()}px`,
                              'max-width': `${header.getSize()}px`,
                            }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                            {/** biome-ignore lint/a11y/noStaticElementInteractions: <explanation> */}
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              style={{
                                position: 'absolute',
                                right: '0',
                                top: '0',
                                height: '100%',
                                width: '0.5rem',
                                cursor: 'col-resize',
                                'user-select': 'none',
                                'touch-action': 'none',
                              }}
                            />
                          </th>
                        )}
                      </For>
                    </tr>
                  )}
                </For>
              </thead>
              <tbody>
                <Show when={shouldVirtualize()}>
                  <tr style={{ height: `${topPaddingRem()}rem` }}>
                    <td colSpan={leafColumnCount()} />
                  </tr>
                </Show>

                <For each={visibleRows()}>
                  {(row) => (
                    <tr style={{ height: `${ROW_HEIGHT_REM}rem` }}>
                      <For each={row.getVisibleCells()}>
                        {(cell) => (
                          <td
                            style={{
                              overflow: 'hidden',
                              'white-space': 'nowrap',
                              'text-align': 'left',
                              width: `${cell.column.getSize()}px`,
                              'min-width': `${cell.column.getSize()}px`,
                              'max-width': `${cell.column.getSize()}px`,
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        )}
                      </For>
                    </tr>
                  )}
                </For>

                <Show when={shouldVirtualize()}>
                  <tr style={{ height: `${bottomPaddingRem()}rem` }}>
                    <td colSpan={leafColumnCount()} />
                  </tr>
                </Show>
              </tbody>
            </table>
          </div>
        </Show>
      </dialog>

      <dialog ref={errorDialog} class="result-dialog">
        <div class="dialog-header">
          <h3>Error details</h3>
          <button type="button" onClick={() => errorDialog?.close()}>
            Close
          </button>
        </div>
        <pre class="dialog-body">{errorText()}</pre>
      </dialog>
    </div>
  )
}
