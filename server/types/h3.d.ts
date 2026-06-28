import type { AuthUser } from '../lib/auth'
import type { FinancialSpace, SpaceMember } from '~~/generated/prisma'

export interface FlowRateSpaceAccess {
  user: AuthUser
  space: FinancialSpace
  membership: SpaceMember & { space: FinancialSpace }
}

declare module 'h3' {
  interface H3EventContext {
    flowrateAuth?: AuthUser
    flowrateSpaceAccess?: FlowRateSpaceAccess
  }
}
