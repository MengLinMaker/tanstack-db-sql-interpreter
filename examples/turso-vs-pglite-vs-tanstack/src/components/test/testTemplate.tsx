export function TestTemplate(props: {
  title: string
  subtitle?: string
  isRunning: boolean
  isFinished: boolean
  onStart: () => void
  rows: {
    label: string
    value: string
  }[]
}) {
  return (
    <div class="test">
      <h2>{props.title}</h2>
      {props.subtitle ? <p class="subtitle">{props.subtitle}</p> : null}
      {!props.isRunning && !props.isFinished ? (
        <button type="button" onClick={props.onStart}>
          Start test
        </button>
      ) : null}
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
    </div>
  )
}
