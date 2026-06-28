// ANCHOR: Server-side Neon Auth user provisioning
export interface CreatedAuthUser {
  id: string
  email: string
  name: string
}

function resolveAppOrigin(event?: H3Event): string {
  if (event) {
    return getRequestURL(event).origin
  }
  const config = useRuntimeConfig()
  return (config.public.appUrl as string || 'http://localhost:3000').replace(/\/$/, '')
}

export async function createNeonAuthEmailUser(
  params: {
    email: string
    password: string
    name: string
  },
  event?: H3Event
): Promise<CreatedAuthUser> {
  const config = useRuntimeConfig(event)
  const baseUrl = config.public.neonAuthUrl as string
  const appOrigin = resolveAppOrigin(event)
  if (!baseUrl) {
    throw createError({ statusCode: 503, message: 'Authentication is not configured' })
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: appOrigin,
      Referer: `${appOrigin}/`,
      'x-neon-auth-middleware': 'true'
    },
    body: JSON.stringify({
      email: params.email.toLowerCase(),
      password: params.password,
      name: params.name,
      rememberMe: false
    })
  })

  const data = await response.json().catch(() => ({})) as {
    user?: { id: string, email: string, name: string }
    message?: string
  }

  if (!response.ok) {
    const message = data.message ?? 'Failed to create login account'
    const statusCode = response.status === 422 || message.toLowerCase().includes('exist')
      ? 409
      : 502
    throw createError({ statusCode, message })
  }

  if (!data.user?.id) {
    throw createError({ statusCode: 502, message: 'Invalid authentication response' })
  }

  return {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name
  }
}
