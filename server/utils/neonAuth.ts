// ANCHOR: Deprecated re-exports — use server/lib/auth.ts
export { getAuthSession as getNeonAuthSession, requireAuthUser as requireNeonAuth, requireSessionUser } from '../lib/auth'
export type { AuthUser as NeonAuthUser } from '../lib/auth'
