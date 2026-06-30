// ANCHOR: User notification + subscription preference contract

export interface UserPreferences {
  emailPriceAlerts?: boolean
  weeklyDigest?: boolean
  subscriptionCapMonthly?: number | null
}

export const DEFAULT_USER_PREFERENCES: Required<UserPreferences> = {
  emailPriceAlerts: true,
  weeklyDigest: true,
  subscriptionCapMonthly: null
}

export function parseUserPreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== 'object') return {}
  const obj = raw as Record<string, unknown>
  return {
    emailPriceAlerts: typeof obj.emailPriceAlerts === 'boolean' ? obj.emailPriceAlerts : undefined,
    weeklyDigest: typeof obj.weeklyDigest === 'boolean' ? obj.weeklyDigest : undefined,
    subscriptionCapMonthly: typeof obj.subscriptionCapMonthly === 'number'
      ? obj.subscriptionCapMonthly
      : obj.subscriptionCapMonthly === null
        ? null
        : undefined
  }
}

export function mergeUserPreferences(
  current: unknown,
  patch: UserPreferences
): UserPreferences {
  const base = { ...DEFAULT_USER_PREFERENCES, ...parseUserPreferences(current) }
  return {
    emailPriceAlerts: patch.emailPriceAlerts ?? base.emailPriceAlerts,
    weeklyDigest: patch.weeklyDigest ?? base.weeklyDigest,
    subscriptionCapMonthly: patch.subscriptionCapMonthly !== undefined
      ? patch.subscriptionCapMonthly
      : base.subscriptionCapMonthly
  }
}
