// ANCHOR: Client CSRF bootstrap — primes cookie on app load
export default defineNuxtPlugin(async () => {
  if (document.cookie.includes('flowrate-csrf=')) return

  try {
    await $fetch('/api/auth/get-session', { credentials: 'include' })
  } catch {
    // NOTE - get-session still sets CSRF cookie
  }
})
