// ANCHOR: User profile data access
import type { AppPlan } from '#shared/billing'

export async function findUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      phoneVerified: true,
      plan: true,
      spaceId: true
    }
  })
}

export async function findUserPhoneState(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, phoneVerified: true }
  })
}

export async function findUserByPhone(phone: string, excludeUserId?: string) {
  return prisma.user.findFirst({
    where: {
      phone,
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {})
    }
  })
}

export async function updateUserProfile(
  userId: string,
  data: { name?: string, phone?: string | null, phoneVerified?: Date | null }
) {
  await prisma.user.update({ where: { id: userId }, data })
  return findUserProfile(userId)
}

export async function markPhoneVerified(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { phoneVerified: new Date() }
  })
}

export async function findDefaultIndependentSpaceId(ownerId: string) {
  const space = await prisma.financialSpace.findFirst({
    where: { ownerId, type: 'INDEPENDENT' },
    select: { id: true }
  })
  return space?.id ?? null
}

export async function findUserFeedbackContext(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      space: {
        select: {
          id: true,
          name: true,
          type: true,
          members: {
            where: { userId, status: 'ACTIVE' },
            select: { role: true },
            take: 1
          }
        }
      }
    }
  })
}

export type UserProfileRow = NonNullable<Awaited<ReturnType<typeof findUserProfile>>>

export function profilePlan(row: UserProfileRow): AppPlan {
  return row.plan as AppPlan
}
