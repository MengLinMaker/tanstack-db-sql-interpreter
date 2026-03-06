import { createSignal, onCleanup, onMount } from 'solid-js'

type PerformanceMemory = {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

function bytesToMb(bytes: number) {
  return bytes / (1024 * 1024)
}

export function usePerformance(intervalMs = 1000) {
  const [cpuPercent, setCpuPercent] = createSignal(0)
  const [memorySupported, setMemorySupported] = createSignal(false)
  const [usedMb, setUsedMb] = createSignal(0)
  const [limitMb, setLimitMb] = createSignal(0)

  onMount(() => {
    const perfWithMemory = performance as Performance & {
      memory?: PerformanceMemory
    }
    setMemorySupported(Boolean(perfWithMemory.memory))

    let expected = performance.now() + intervalMs
    const timer = window.setInterval(() => {
      const now = performance.now()
      const lag = Math.max(0, now - expected)
      expected = now + intervalMs
      const cpuEstimate = Math.min(100, (lag / intervalMs) * 100)
      setCpuPercent(Math.round(cpuEstimate * 10) / 10)

      const memory = perfWithMemory.memory
      if (memory) {
        setUsedMb(Math.round(bytesToMb(memory.usedJSHeapSize) * 10) / 10)
        setLimitMb(Math.round(bytesToMb(memory.jsHeapSizeLimit) * 10) / 10)
      }
    }, intervalMs)

    onCleanup(() => {
      window.clearInterval(timer)
    })
  })

  return {
    cpuPercent,
    memorySupported,
    usedMb,
    limitMb,
  }
}
