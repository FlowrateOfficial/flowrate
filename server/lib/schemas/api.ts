// ANCHOR: Shared Zod field schemas for API bodies
import { z } from 'zod'
import { BUDGET_CATEGORIES, TRANSACTION_CATEGORIES } from '#shared/categories'
import { ENUM } from '#shared/prisma-enums'
import { zodPrismaEnum } from './prisma-zod'

const budgetPeriodSchema = zodPrismaEnum(ENUM.period)
const visibilitySchema = zodPrismaEnum(ENUM.visibility)
const sharedSpaceTypeSchema = z.enum([
  ENUM.space.HOUSEHOLD,
  ENUM.space.FAMILY,
  ENUM.space.COMPANY
])
const familyInviteRoleSchema = z.enum([
  ENUM.role.CO_GUARDIAN,
  ENUM.role.TEEN,
  ENUM.role.CHILD,
  ENUM.role.FINANCE_ADMIN,
  ENUM.role.MANAGER,
  ENUM.role.MEMBER,
  ENUM.role.GUEST
])
const companyInviteRoleSchema = z.enum([
  ENUM.role.FINANCE_ADMIN,
  ENUM.role.GUEST
])
const minorRoleSchema = z.enum([
  ENUM.role.CHILD,
  ENUM.role.TEEN
])
const splitRuleModeSchema = zodPrismaEnum(ENUM.split)

export { visibilitySchema }

export const emptyBodySchema = z.object({}).strict()

export const optionalEmptyBodySchema = z.object({}).strict().optional()

export const syncAccountsBodySchema = z.object({
  accountIds: z.array(z.string().min(1)).optional(),
  visibility: visibilitySchema.default(ENUM.visibility.PERSONAL),
  syncAll: z.boolean().optional()
})

export const plaidSyncAccountsBodySchema = z.object({
  visibility: visibilitySchema.default(ENUM.visibility.PERSONAL),
  syncAll: z.boolean().optional()
})

export const connectBankBodySchema = z.object({
  visibility: visibilitySchema.default(ENUM.visibility.PERSONAL)
})

export const plaidExchangeBodySchema = z.object({
  publicToken: z.string().min(1),
  visibility: visibilitySchema.default(ENUM.visibility.PERSONAL),
  institution: z.string().optional(),
  metadata: z.object({
    institution: z.object({ name: z.string().optional() }).passthrough().optional()
  }).passthrough().optional()
})

export const stripeCheckoutBodySchema = z.object({
  planKey: z.string().optional().default('pro'),
  priceId: z.string().optional(),
  interval: z.enum(['month', 'year']).optional().default('month'),
  currency: z.string().length(3).optional()
})

export const stripeSyncSubscriptionBodySchema = z.object({
  sessionId: z.string().optional()
})

export const budgetBodySchema = z.object({
  name: z.string().min(1),
  category: z.enum(BUDGET_CATEGORIES),
  amount: z.number().positive(),
  period: budgetPeriodSchema,
  isShared: z.boolean().default(false)
})

export const transactionPatchBodySchema = z.object({
  category: z.enum(TRANSACTION_CATEGORIES).optional(),
  description: z.string().min(1).max(500).optional()
})

export const memberDeleteBodySchema = z.object({
  purge: z.boolean().optional()
})

export const phoneVerifyBodySchema = z.object({
  code: z.string().min(4).max(12)
})

export const createSpaceBodySchema = z.object({
  name: z.string().min(2).max(80),
  type: sharedSpaceTypeSchema
})

export const activeSpaceBodySchema = z.object({
  spaceId: z.string().min(1)
})

export const subscriptionListQuerySchema = z.object({
  status: zodPrismaEnum(ENUM.subscription).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  includeHidden: z.coerce.boolean().optional()
})

export const subscriptionPatchBodySchema = z.object({
  displayName: z.string().max(120).nullable().optional(),
  hidden: z.boolean().optional(),
  excluded: z.boolean().optional()
})

export const userPreferencesPatchSchema = z.object({
  emailPriceAlerts: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  subscriptionCapMonthly: z.number().positive().nullable().optional()
})

export const spaceSettingsPatchSchema = z.object({
  subscriptionCapMonthly: z.number().positive().nullable().optional()
})

export const savingsGoalBodySchema = z.object({
  name: z.string().min(1).max(80),
  target: z.number().positive().nullable().optional(),
  currency: z.string().length(3).optional()
})

export const savingsGoalContributeSchema = z.object({
  amount: z.number().positive()
})

export const analyticsRangeQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', '12m']).default('30d')
})

export const familyInviteBodySchema = z.object({
  email: z.string().email(),
  role: familyInviteRoleSchema,
  name: z.string().min(1).optional(),
  birthday: z.string().datetime().optional()
})

export const companyInviteBodySchema = z.object({
  phone: z.string().min(8).max(20),
  email: z.string().email().optional(),
  role: companyInviteRoleSchema,
  name: z.string().min(1).optional()
})

export const createChildBodySchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: minorRoleSchema,
  birthday: z.string().datetime().optional()
})

export const splitRuleBodySchema = z.object({
  name: z.string().min(1),
  category: z.enum(TRANSACTION_CATEGORIES).optional(),
  mode: splitRuleModeSchema,
  splits: z.record(z.string(), z.number()).default({})
})

export const childProfilePatchBodySchema = z.object({
  allowance: z.number().min(0).optional(),
  frequency: budgetPeriodSchema.optional(),
  learnMode: z.boolean().optional(),
  limits: z.record(z.string(), z.number()).optional()
})

export const savingsJarBodySchema = z.object({
  name: z.string().min(1),
  target: z.number().min(0).optional()
})

export const accountDeleteBodySchema = z.object({
  confirmEmail: z.string().email(),
  emailCode: z.string().min(4).max(12),
  phoneCode: z.string().min(4).max(12).optional(),
  password: z.string().min(1).optional()
})

export const invitationCompleteBodySchema = z.object({
  password: z.string().min(8).max(128),
  email: z.string().email().optional(),
  name: z.string().min(1).max(100).optional()
})

export const stripePlanChangeBodySchema = z.object({
  planKey: z.string().min(1),
  interval: z.enum(['month', 'year'])
})

export const profilePatchBodySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional().nullable()
})

export const feedbackPayloadSchema = z.object({
  type: z.enum(['review', 'feature', 'bug']),
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().max(12_000),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  includeContext: z.coerce.boolean().optional().default(true),
  path: z.string().max(200).optional(),
  attachmentIds: z.array(z.string().min(1).max(80)).max(8).optional()
}).superRefine((data, ctx) => {
  if (data.type === 'review' && data.rating == null) {
    ctx.addIssue({
      code: 'custom',
      message: 'Rating is required for reviews',
      path: ['rating']
    })
  }

  const hasAttachments = (data.attachmentIds?.length ?? 0) > 0
  if (data.message.trim().length < 10 && !hasAttachments) {
    ctx.addIssue({
      code: 'custom',
      message: 'Message is too short',
      path: ['message']
    })
  }
})
