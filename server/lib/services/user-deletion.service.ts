// ANCHOR: Account deletion — Stripe, DB, Neon Auth purge
import type { H3Event } from 'h3'
import type Stripe from 'stripe'
import { getStripeClient } from '../stripe/client'
import { clearStripeCustomerId } from '../billing/repository'
import { deleteNeonAuthUserByAdmin, deleteNeonAuthUserSelf } from '../neonAuthAdmin'
import { isChildRole, isGuardianRole } from '../../utils/spaceAuth'

export interface PurgeUserDataResult {
  userId: string
  disconnectedBanks: number
  deletedSpaces: number
  transferredSpaces: number
}

async function disconnectUserBankAccounts(
  stripe: Stripe | null,
  userId: string
): Promise<number> {
  const accounts = await prisma.account.findMany({
    where: { userId, stripeId: { not: null } },
    select: { stripeId: true }
  })

  if (!stripe) return accounts.length

  let disconnected = 0
  for (const account of accounts) {
    if (!account.stripeId) continue
    try {
      await stripe.financialConnections.accounts.disconnect(account.stripeId)
      disconnected++
    } catch {
      // NOTE - Already disconnected at Stripe
    }
  }
  return disconnected
}

async function cancelStripeBilling(stripe: Stripe | null, userId: string) {
  if (!stripe) return

  const billing = await prisma.userBilling.findUnique({
    where: { userId },
    include: { subscription: true }
  })
  if (!billing?.customerId) return

  if (billing.subscription?.subId) {
    try {
      await stripe.subscriptions.cancel(billing.subscription.subId)
    } catch {
      // NOTE - Subscription may already be canceled
    }
  }

  try {
    await stripe.customers.del(billing.customerId)
  } catch {
    // NOTE - Stripe customer may already be deleted
  }

  await clearStripeCustomerId(userId)
}

async function resolveOwnedSpaces(userId: string) {
  let deletedSpaces = 0
  let transferredSpaces = 0
  const deletedSpaceIds: string[] = []

  const ownedSpaces = await prisma.financialSpace.findMany({
    where: { ownerId: userId },
    include: {
      members: {
        where: {
          status: 'ACTIVE',
          userId: { not: userId }
        }
      }
    }
  })

  for (const space of ownedSpaces) {
    if (space.type === 'INDEPENDENT' || !space.members.length) {
      await prisma.financialSpace.delete({ where: { id: space.id } })
      deletedSpaceIds.push(space.id)
      deletedSpaces++
      continue
    }

    const successor = space.members.find(m => m.role === 'CO_GUARDIAN')
      ?? space.members.find(m => m.role === 'FINANCE_ADMIN')
      ?? space.members.find(m => m.role === 'MANAGER')
      ?? space.members[0]

    if (!successor?.userId) {
      await prisma.financialSpace.delete({ where: { id: space.id } })
      deletedSpaceIds.push(space.id)
      deletedSpaces++
      continue
    }

    await prisma.$transaction([
      prisma.financialSpace.update({
        where: { id: space.id },
        data: { ownerId: successor.userId! }
      }),
      prisma.spaceMember.update({
        where: { id: successor.id },
        data: { role: space.type === 'COMPANY' ? successor.role : 'OWNER' }
      })
    ])
    transferredSpaces++
  }

  return { deletedSpaces, transferredSpaces, deletedSpaceIds }
}

// NOTE - Removes app data only — Neon Auth login deleted separately
export async function purgeUserApplicationData(
  userId: string,
  event?: H3Event
): Promise<PurgeUserDataResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true }
  })
  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const config = event ? useRuntimeConfig(event) : useRuntimeConfig()
  const stripe = config.stripeSecretKey
    ? getStripeClient(config.stripeSecretKey as string)
    : null

  const disconnectedBanks = await disconnectUserBankAccounts(stripe, userId)
  await cancelStripeBilling(stripe, userId)

  const { deletedSpaces, transferredSpaces, deletedSpaceIds } = await resolveOwnedSpaces(userId)

  if (deletedSpaceIds.length) {
    await prisma.user.updateMany({
      where: { spaceId: { in: deletedSpaceIds } },
      data: { spaceId: null }
    })
  }

  await prisma.spaceInvitation.deleteMany({
    where: { email: user.email.toLowerCase() }
  })

  await prisma.spaceMember.deleteMany({ where: { userId } })

  await prisma.user.delete({ where: { id: userId } })

  return {
    userId,
    disconnectedBanks,
    deletedSpaces,
    transferredSpaces
  }
}

export async function deleteOwnUserAccount(
  event: H3Event,
  input: { password?: string, confirmEmail: string }
) {
  const sessionUser = await requireSessionUser(event)
  const confirmEmail = input.confirmEmail.trim().toLowerCase()

  if (confirmEmail !== sessionUser.email.toLowerCase()) {
    throw createError({ statusCode: 400, message: 'Email confirmation does not match' })
  }

  const result = await purgeUserApplicationData(sessionUser.id, event)

  try {
    await deleteNeonAuthUserSelf(event, input.password)
  } catch (error) {
    console.error('[user-deletion] Neon Auth self-delete failed after app purge:', error)
    throw createError({
      statusCode: 502,
      message: 'Your data was removed but login deletion failed. Contact mathieu.lievre.pro@outlook.com.'
    })
  }

  return result
}

export async function deleteOffspringUserAccount(
  event: H3Event,
  spaceId: string,
  memberId: string
) {
  const { user, space, membership } = await requireSpaceAccess(event, { spaceId })

  if (space.type !== 'FAMILY' && space.type !== 'HOUSEHOLD') {
    throw createError({ statusCode: 400, message: 'Child account deletion is only available in family spaces' })
  }

  if (!isGuardianRole(membership.role)) {
    throw createError({ statusCode: 403, message: 'Only guardians can delete child or teen accounts' })
  }

  const target = await prisma.spaceMember.findFirst({
    where: { id: memberId, spaceId },
    include: { childProfile: true }
  })

  if (!target) {
    throw createError({ statusCode: 404, message: 'Member not found' })
  }

  if (!isChildRole(target.role)) {
    throw createError({ statusCode: 400, message: 'Only child or teen accounts can be deleted this way' })
  }

  if (!target.userId) {
    await prisma.spaceMember.delete({ where: { id: memberId } })
    return { ok: true, purged: false }
  }

  if (target.userId === user.id) {
    throw createError({ statusCode: 400, message: 'Use Settings to delete your own account' })
  }

  const result = await purgeUserApplicationData(target.userId, event)

  try {
    await deleteNeonAuthUserByAdmin(target.userId, event)
  } catch (error) {
    console.error('[user-deletion] Neon Auth admin delete failed after app purge:', error)
    throw createError({
      statusCode: 502,
      message: 'Account data was removed but login deletion failed. Contact mathieu.lievre.pro@outlook.com.'
    })
  }

  return { ok: true, purged: true, ...result }
}
