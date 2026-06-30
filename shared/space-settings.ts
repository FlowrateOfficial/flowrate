// ANCHOR: Space-level settings stored on FinancialSpace.settings Json

export interface SpaceSettings {
  subscriptionCapMonthly?: number | null
}

export function parseSpaceSettings(raw: unknown): SpaceSettings {
  if (!raw || typeof raw !== 'object') return {}
  const obj = raw as Record<string, unknown>
  return {
    subscriptionCapMonthly: typeof obj.subscriptionCapMonthly === 'number'
      ? obj.subscriptionCapMonthly
      : obj.subscriptionCapMonthly === null
        ? null
        : undefined
  }
}

export function mergeSpaceSettings(
  current: unknown,
  patch: SpaceSettings
): SpaceSettings {
  return { ...parseSpaceSettings(current), ...patch }
}

export function effectiveSubscriptionCap(
  userPrefs: { subscriptionCapMonthly?: number | null },
  spaceSettings: SpaceSettings
): number | null {
  return userPrefs.subscriptionCapMonthly ?? spaceSettings.subscriptionCapMonthly ?? null
}
