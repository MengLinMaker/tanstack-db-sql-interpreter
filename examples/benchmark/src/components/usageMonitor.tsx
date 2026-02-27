import { createEffect, createSignal, Show } from 'solid-js'
import { usePerformance } from '../hooks/usePerformance.ts'

export function UsageMonitor(props: { intervalMs?: number }) {
  const usage = usePerformance(props.intervalMs ?? 1000)
  const [maxCpuPercent, setMaxCpuPercent] = createSignal(0)
  const [maxUsedMb, setMaxUsedMb] = createSignal(0)

  createEffect(() => {
    const currentCpu = usage.cpuPercent()
    if (currentCpu > maxCpuPercent()) {
      setMaxCpuPercent(currentCpu)
    }
  })

  createEffect(() => {
    if (!usage.memorySupported()) return
    const currentMemory = usage.usedMb()
    if (currentMemory > maxUsedMb()) {
      setMaxUsedMb(currentMemory)
    }
  })

  return (
    <div class="usage-monitor">
      <h2 class="usage-monitor-title">Performance</h2>
      <div class="usage-actions">
        <button
          type="button"
          onClick={() => {
            setMaxCpuPercent(0)
            setMaxUsedMb(0)
          }}
        >
          Reset max
        </button>
      </div>
      <table>
        <tbody>
          <tr>
            <td>Main CPU</td>
            <td
              class="usage-cell"
              style={{
                '--bar-width': `${usage.cpuPercent()}%`,
              }}
            >
              {usage.cpuPercent()}%
            </td>
          </tr>
          <tr>
            <td>Max CPU</td>
            <td
              class="usage-cell"
              style={{
                '--bar-width': `${maxCpuPercent()}%`,
              }}
            >
              {maxCpuPercent()}%
            </td>
          </tr>
          <tr>
            <td>Heap mem</td>
            <td>
              <Show
                when={usage.memorySupported()}
                fallback="Unsupported browser"
              >
                {usage.usedMb()} MB
              </Show>
            </td>
          </tr>
          <tr>
            <td>Max mem</td>
            <td>
              <Show
                when={usage.memorySupported()}
                fallback="Unsupported browser"
              >
                {maxUsedMb()} MB
              </Show>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
