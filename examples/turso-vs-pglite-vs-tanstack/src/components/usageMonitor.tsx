import { Show } from 'solid-js'
import { usePerformance } from '../hooks/usePerformance.ts'

export function UsageMonitor(props: { intervalMs?: number }) {
  const usage = usePerformance(props.intervalMs ?? 1000)

  return (
    <div class="usage-monitor">
      <h2>Performance</h2>
      <table>
        <tbody>
          <tr>
            <td>CPU (main thread)</td>
            <td>{usage.cpuPercent()}%</td>
          </tr>
          <Show
            when={usage.memorySupported()}
            fallback={
              <tr>
                <td>Memory (JS heap)</td>
                <td>Not available in this browser.</td>
              </tr>
            }
          >
            <tr>
              <td>Memory (JS heap)</td>
              <td>
                {usage.usedMb()} MB / {usage.limitMb()} MB
              </td>
            </tr>
          </Show>
        </tbody>
      </table>
    </div>
  )
}
