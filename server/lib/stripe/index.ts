export {
  extractStripeId,
  getStripeClient,
  requireStripe,
  resolveHttpsBaseUrl
} from './client'

export {
  ensureStripeCustomer,
  findAndLinkStripeCustomer,
  linkStripeCustomerToUser,
  resolveUserIdFromStripeCustomer
} from './customer'

export {
  assertFinancialConnectionOwnership,
  accountNameFromFinancialConnection,
  balanceFromFinancialConnectionAccount,
  createBankLinkSession,
  linkContextFromStripeCustomer,
  mapFinancialConnectionSubcategory,
  upsertFinancialConnectionAccount
} from './financial-connections'

export type { StripeLinkContext, StripeUserRef } from './types'
