// NOTE - ANCHOR: Admin access gate via ADMIN_EMAILS env list
export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string, raw: string | undefined): boolean {
  const allowed = parseAdminEmails(raw)
  return allowed.length > 0 && allowed.includes(email.trim().toLowerCase())
}

export async function requireAdmin(event: Parameters<typeof requireNeonAuth>[0]) {
  const user = await requireNeonAuth(event)
  const config = useRuntimeConfig(event)
  const allowed = parseAdminEmails(config.adminEmails)

  if (!allowed.length) {
    throw createError({
      statusCode: 503,
      message: 'Admin dashboard is not configured (set ADMIN_EMAILS)'
    })
  }

  if (!isAdminEmail(user.email, config.adminEmails)) {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  return user
}
