import type { H3Event } from 'h3'
import { requireSessionUser } from '../lib/auth'

export async function loadStripeUserContext(event: H3Event) {
  const user = await requireSessionUser(event)

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      spaceId: true
    }
  })

  if (!dbUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const defaultSpace = await prisma.financialSpace.findFirst({
    where: { ownerId: user.id, type: 'INDEPENDENT' },
    select: { id: true }
  })

  return {
    user: dbUser,
    metadata: {
      userId: user.id,
      spaceId: dbUser.spaceId ?? defaultSpace?.id ?? '',
      visibility: 'PERSONAL'
    }
  }
}

export function stripeInvoiceTemplateId(event: H3Event): string | undefined {
  const id = useRuntimeConfig(event).stripeInvoiceTemplateId as string
  return id?.trim() || undefined
}
