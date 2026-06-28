// NOTE - Prime CSRF cookie on client boot
export default defineNuxtPlugin(async () => {
  if (document.cookie.includes('flowrate-csrf=')) return

  try {
    await $fetch('/api/auth/get-session', { credentials: 'include' })
  } catch {
    // NOTE - GET still sets CSRF via security middleware
  }
})
