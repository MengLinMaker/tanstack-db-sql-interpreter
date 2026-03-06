import { createVirtualizer } from '@tanstack/solid-virtual'
import { createMemo, createSignal, For, Show } from 'solid-js'

const VIEWPORT_HEIGHT_REM = 22.0
const LINE_HEIGHT_PX = 18
const ROW_PADDING_PX = 8

type RowObject = Record<string, unknown>

const stringifyRow = (row: unknown) =>
  JSON.stringify(
    row,
    (_key, value) => (typeof value === 'bigint' ? Number(value) : value),
    2,
  )

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
  let scrollRef: HTMLDivElement | undefined

  const [resultText, setResultText] = createSignal('')
  const [errorText, setErrorText] = createSignal('')
  const [resultRows, setResultRows] = createSignal<RowObject[] | null>(null)
  const [rowHeightPx, setRowHeightPx] = createSignal(
    LINE_HEIGHT_PX + ROW_PADDING_PX,
  )

  const normalizeResultRows = (payload: QueryResultPayload) => {
    const sourceRows = payload.rows ?? []

    if (payload.columns && payload.columns.length > 0) {
      return sourceRows.map((row) => {
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
    }

    return sourceRows.map((row) =>
      row && typeof row === 'object' ? (row as RowObject) : { value: row },
    )
  }

  const rows = createMemo(() => resultRows() ?? [])
  const rowCount = createMemo(() => rows().length)

  const rowVirtualizer = createVirtualizer({
    get count() {
      return rows().length
    },
    getScrollElement: () => scrollRef ?? null,
    estimateSize: () => rowHeightPx(),
    overscan: 8,
  })

  const openResults = async () => {
    const result = await props.onShowResults()
    if (!dialog) return

    if (typeof result === 'string') {
      setResultText(result)
      setResultRows(null)
      setRowHeightPx(LINE_HEIGHT_PX + ROW_PADDING_PX)
    } else {
      const normalized = normalizeResultRows(result)
      setResultText('')
      setResultRows(normalized)
      if (normalized.length > 0) {
        const first = stringifyRow(normalized[0])
        const lines = first.split('\n').length
        setRowHeightPx(lines * LINE_HEIGHT_PX + ROW_PADDING_PX)
      } else {
        setRowHeightPx(LINE_HEIGHT_PX + ROW_PADDING_PX)
      }
    }

    dialog.showModal()
    rowVirtualizer.scrollToOffset(0)
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
            ref={scrollRef}
            class="dialog-body"
            style={{
              height: `${VIEWPORT_HEIGHT_REM}rem`,
              'overflow-y': 'scroll',
              'overflow-x': 'scroll',
              'max-width': '100%',
              'white-space': 'pre',
            }}
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: 'relative',
              }}
            >
              <For each={rowVirtualizer.getVirtualItems()}>
                {(virtualRow) => (
                  <div
                    style={{
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <pre
                      style={{
                        margin: '0',
                        display: 'block',
                        'text-align': 'left',
                        'white-space': 'pre-wrap',
                      }}
                    >
                      {stringifyRow(rows()[virtualRow.index])}
                    </pre>
                  </div>
                )}
              </For>
            </div>
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
