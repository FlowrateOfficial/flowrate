import type { AuthUser } from '../lib/auth'
import type { ChildProfile, FinancialSpace, SpaceMember } from '~~/generated/prisma/client'

export type SpaceMembershipWithSpace = SpaceMember & {
  space: FinancialSpace
  childProfile?: ChildProfile | null
}

export interface FlowRateSpaceAccess {
  user: AuthUser
  space: FinancialSpace
  membership: SpaceMembershipWithSpace
}

declare module 'h3' {
  interface H3EventContext {
    flowrateAuth?: AuthUser
    flowrateSpaceAccess?: FlowRateSpaceAccess
  }
}
