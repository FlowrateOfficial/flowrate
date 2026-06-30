// ANCHOR: Prisma enum constants — single source of truth from generated client
// Use ENUM.subscription.PRICE_CHANGED instead of 'PRICE_CHANGED'

export * from '../generated/prisma/enums'

import {
  Plan,
  SpaceType,
  SpaceRole,
  MemberStatus,
  AccountType,
  AccountVisibility,
  TransactionCategory,
  BudgetPeriod,
  SubscriptionStatus,
  SplitRuleType,
  SubStatus,
  LinkProvider
} from '../generated/prisma/enums'

/**
 * Grouped Prisma enums — short keys, still readable.
 * plan · space · role · member · account · visibility · category · period
 * subscription · split · billing · link
 */
export const ENUM = {
  plan: Plan,
  space: SpaceType,
  role: SpaceRole,
  member: MemberStatus,
  account: AccountType,
  visibility: AccountVisibility,
  category: TransactionCategory,
  period: BudgetPeriod,
  subscription: SubscriptionStatus,
  split: SplitRuleType,
  billing: SubStatus,
  link: LinkProvider
} as const

/** All values of a Prisma enum object as a typed tuple (for Zod, filters, etc.) */
export function enumValues<T extends Record<string, string>>(enumObj: T) {
  return Object.values(enumObj) as [T[keyof T], ...T[keyof T][]]
}
