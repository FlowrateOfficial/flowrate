/** @deprecated Use server/lib/auth.ts — kept for existing API route imports */
export { getAuthSession as getNeonAuthSession, requireAuthUser as requireNeonAuth, requireSessionUser } from '../lib/auth'
export type { AuthUser as NeonAuthUser } from '../lib/auth'
