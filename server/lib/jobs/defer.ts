// ANCHOR: Fire-and-forget background work — webhook handlers return fast
export function deferTask(label: string, task: () => Promise<void>) {
  void task().catch((error) => {
    console.error(`[defer:${label}]`, error)
  })
}
