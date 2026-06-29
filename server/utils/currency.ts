import type { H3Event } from 'h3'
import { resolveDisplayCurrency } from '#shared/currency'

export function localeFromRequest(event: H3Event): string {
  const cookie = getCookie(event, 'user-locale')
  if (cookie) return cookie

  const accept = getHeader(event, 'accept-language') ?? ''
  if (accept.toLowerCase().includes('fr')) return 'fr'
  if (accept.toLowerCase().includes('en-gb')) return 'en-GB'
  return 'en'
}

export async function resolveSpaceDisplayCurrency(
  spaceId: string,
  localeHint = 'en'
): Promise<string> {
  const accounts = await prisma.account.findMany({
    where: { spaceId },
    select: { currency: true }
  })
  return resolveDisplayCurrency(localeHint, accounts)
}
