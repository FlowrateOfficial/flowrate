// ANCHOR: Prisma enums + ENUM groups (plan, space, role, member, …)

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

export * from '../generated/prisma/enums'

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

// NOTE - enum object → typed value array
export function enumValues<T extends Record<string, string>>(enumObj: T) {
  return Object.values(enumObj) as [T[keyof T], ...T[keyof T][]]
}
