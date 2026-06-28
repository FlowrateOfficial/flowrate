// NOTE - ANCHOR: Layout session check — logo target, guest UI
export function useSessionUser() {
  const { getSession } = useNeonAuth()

  const { data: session, refresh } = useAsyncData(
    'neon-auth-session',
    () => getSession(),
    { dedupe: 'defer' }
  )

  const isLoggedIn = computed(() => Boolean(session.value?.user?.id))
  const homePath = computed(() => (isLoggedIn.value ? '/dashboard' : '/'))

  return { session, isLoggedIn, homePath, refreshSession: refresh }
}
