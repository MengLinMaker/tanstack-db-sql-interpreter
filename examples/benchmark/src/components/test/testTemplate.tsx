export function TestTemplate(props: {
  title: string
  subtitle?: string
  isRunning: boolean
  isFinished: boolean
  onStart: () => void
  onShowResults: () => Promise<string> | string
  rows: {
    label: string
    value: string
    barPercent?: number
  }[]
}) {
  let dialog: HTMLDialogElement | undefined

  const openResults = async () => {
    const result = await props.onShowResults()
    if (!dialog) return
    const content = dialog.querySelector('pre')
    const countLabel = dialog.querySelector('[data-row-count]')
    if (content) content.textContent = result
    if (countLabel) {
      let count = 0
      try {
        const parsed = JSON.parse(result)
        count = Array.isArray(parsed) ? parsed.length : 0
      } catch {
        count = 0
      }
      countLabel.textContent = `Rows: ${count}`
    }
    dialog.showModal()
  }

  return (
    <div class="test">
      <h2>{props.title}</h2>
      <div class="test-actions">
        {!props.isRunning && !props.isFinished ? (
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
        <p class="dialog-meta" data-row-count>
          Rows: 0
        </p>
        <pre class="dialog-body"></pre>
      </dialog>
    </div>
  )
}
