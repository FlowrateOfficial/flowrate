import type { AccountVisibility } from '~/generated/prisma'

export interface StripeLinkContext {
  userId: string
  spaceId: string
  visibility: AccountVisibility
}

export interface StripeUserRef {
  id: string
  email: string
  name: string | null
}
