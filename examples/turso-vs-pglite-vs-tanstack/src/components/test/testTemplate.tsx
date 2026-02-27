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
  }[]
}) {
  let dialog: HTMLDialogElement | undefined

  const openResults = async () => {
    const result = await props.onShowResults()
    if (!dialog) return
    const content = dialog.querySelector('pre')
    if (content) content.textContent = result
    dialog.showModal()
  }

  return (
    <div class="test">
      <h2>{props.title}</h2>
      {props.subtitle ? <p class="subtitle">{props.subtitle}</p> : null}
      <div class="test-actions">
        {!props.isRunning && !props.isFinished ? (
          <button type="button" onClick={props.onStart}>
            Start test
          </button>
        ) : null}
        <button type="button" onClick={() => void openResults()}>
          View query results
        </button>
      </div>
      <table>
        <tbody>
          {props.rows.map((row) => (
            <tr>
              <td>{row.label}</td>
              <td>{row.value}</td>
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
        <pre class="dialog-body"></pre>
      </dialog>
    </div>
  )
}
