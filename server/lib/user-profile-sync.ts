import type { H3Event } from 'h3'
import { getStripeCustomerId } from './billing/repository'
import { requireStripe } from './stripe'
import { syncStripeCustomerPhone } from './stripe/customer-profile'
import { extractNeonAuthCookies } from '../utils/neonAuthProxy'

export interface UserProfileSyncInput {
  userId: string
  name: string | null
  email: string
}

async function updateNeonAuthUserName(event: H3Event, name: string): Promise<void> {
  const config = useRuntimeConfig(event)
  const baseUrl = config.public.neonAuthUrl as string
  if (!baseUrl) return

  const cookieHeader = getRequestHeader(event, 'cookie') ?? ''
  const origin = getRequestURL(event).origin

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/update-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
      Referer: `${origin}/`,
      Cookie: extractNeonAuthCookies(cookieHeader)
    },
    body: JSON.stringify({ name })
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { message?: string }
    console.warn('[user-profile-sync] Neon Auth update-user failed:', data.message ?? response.status)
  }
}

async function syncStripeCustomerProfile(
  event: H3Event,
  userId: string,
  profile: Pick<UserProfileSyncInput, 'name' | 'email'>
): Promise<void> {
  const customerId = await getStripeCustomerId(userId)
  if (!customerId) return

  try {
    const { stripe } = requireStripe(event)
    await stripe.customers.update(customerId, {
      name: profile.name ?? undefined,
      email: profile.email
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 503) {
      return
    }
    console.warn('[user-profile-sync] Stripe customer update failed:', error)
  }
}

/** Push verified profile phone to Stripe customer (best-effort). */
export async function syncVerifiedPhoneToStripe(
  event: H3Event,
  userId: string,
  phone: string | null
): Promise<void> {
  const customerId = await getStripeCustomerId(userId)
  if (!customerId) return

  try {
    const { stripe } = requireStripe(event)
    await syncStripeCustomerPhone(stripe, userId, phone)
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 503) {
      return
    }
    console.warn('[user-profile-sync] Stripe customer phone sync failed:', error)
  }
}

/** Push DB profile fields to Neon Auth session + Stripe customer (best-effort). */
export async function syncUserProfileToIntegrations(
  event: H3Event,
  profile: UserProfileSyncInput
): Promise<void> {
  const tasks: Promise<void>[] = [
    syncStripeCustomerProfile(event, profile.userId, profile)
  ]

  if (profile.name?.trim()) {
    tasks.push(updateNeonAuthUserName(event, profile.name.trim()))
  }

  await Promise.allSettled(tasks)
}
