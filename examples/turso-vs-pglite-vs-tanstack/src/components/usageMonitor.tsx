import { Show } from 'solid-js'
import { usePerformance } from '../hooks/usePerformance.ts'

export function UsageMonitor(props: {
  intervalMs?: number
}) {
  const usage = usePerformance(props.intervalMs ?? 1000)

  return (
    <div class="chrome-usage-monitor">
      <h2>Performance</h2>
      <div>CPU (main thread): {usage.cpuPercent()}%</div>
      <Show
        when={usage.memorySupported()}
        fallback={<div>Memory (JS heap): not available in this browser.</div>}
      >
        <div>
          Memory (JS heap): {usage.usedMb()} MB / {usage.limitMb()} MB
        </div>
      </Show>
    </div>
  )
}
