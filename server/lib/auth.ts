/**
 * Server-side Neon Auth for Nuxt/Nitro.
 *
 * Mirrors the Next.js `createNeonAuth()` pattern: proxy auth API on the app origin,
 * read sessions from request cookies, provision app users after sign-in.
 *
 * @see https://neon.com/docs/auth/authentication-flow
 */
import type { H3Event } from 'h3'
import {
  getSessionFromEvent,
  getSocialOAuthRedirectUrl,
  tryOAuthSessionExchange
} from '../utils/neonAuthProxy'

export { NEON_AUTH_SESSION_VERIFIER_PARAM } from '../../shared/auth'
export { getSocialOAuthRedirectUrl, tryOAuthSessionExchange }

export interface AuthUser {
  id: string
  email: string
  name: string | null
  emailVerified: boolean
  image?: string | null
}

export async function getAuthSession(event: H3Event) {
  const session = await getSessionFromEvent(event)
  if (!session?.user || !session.session) return null
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? null,
      emailVerified: session.user.emailVerified,
      image: session.user.image ?? null
    },
    session: {
      id: session.session.id,
      userId: session.session.userId,
      expiresAt: session.session.expiresAt
    }
  }
}

export async function requireAuthUser(event: H3Event): Promise<AuthUser> {
  const session = await getAuthSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const user = session.user
  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.image ?? null
    },
    update: {
      name: user.name ?? undefined,
      avatarUrl: user.image ?? undefined
    }
  })

  await ensureDefaultIndependentSpace(user.id, dbUser.name)
  await acceptPendingInvitations(user.id, user.email)

  return user
}
