/** Migrate legacy localStorage active-space id into cookie before client navigation/hydration. */
export default defineNuxtPlugin(() => {
  const cookie = useCookie<string | null>('flowrate-active-space', { default: () => null })

  if (cookie.value) return

  try {
    const legacy = localStorage.getItem('flowrate-active-space')
    if (legacy) cookie.value = legacy
  } catch {
    // localStorage unavailable
  }
})
