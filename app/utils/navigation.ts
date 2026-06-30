// ANCHOR: Post-auth navigation — full reload avoids auth→dashboard hydration mismatch
export function navigateToDashboard(path = '/dashboard') {
  return navigateTo(path, { external: true })
}
