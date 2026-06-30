import { describe, expect, it } from 'vitest'
import {
  allowsWebhookSync,
  syncCooldownRemainingMs
} from './enforcement'
import { PLAN_LIMITS } from '#shared/plan-limits'

describe('billing enforcement', () => {
  describe('syncCooldownRemainingMs', () => {
    it('allows sync when no prior sync exists', () => {
      expect(syncCooldownRemainingMs(null, 24)).toBe(0)
    })

    it('allows sync when plan has no cooldown', () => {
      const last = new Date('2026-01-01T12:00:00Z')
      expect(syncCooldownRemainingMs(last, 0, Date.parse('2026-01-01T13:00:00Z'))).toBe(0)
    })

    it('blocks sync inside free-plan cooldown window', () => {
      const last = new Date('2026-06-29T12:00:00Z')
      const now = Date.parse('2026-06-29T18:00:00Z')
      const remaining = syncCooldownRemainingMs(last, 24, now)
      expect(remaining).toBeGreaterThan(0)
      expect(remaining).toBe(18 * 60 * 60 * 1000)
    })

    it('allows sync after cooldown elapsed', () => {
      const last = new Date('2026-06-28T12:00:00Z')
      const now = Date.parse('2026-06-29T18:00:00Z')
      expect(syncCooldownRemainingMs(last, 24, now)).toBe(0)
    })
  })

  describe('allowsWebhookSync', () => {
    it('disables webhook sync on free plan', () => {
      expect(allowsWebhookSync('FREE')).toBe(false)
    })

    it('enables webhook sync on paid plans', () => {
      expect(allowsWebhookSync('PRO')).toBe(true)
      expect(allowsWebhookSync('ENTERPRISE')).toBe(true)
    })
  })

  describe('plan limits', () => {
    it('throttles manual sync on free tier only', () => {
      expect(PLAN_LIMITS.FREE.manualSyncIntervalHours).toBeGreaterThan(0)
      expect(PLAN_LIMITS.PRO.manualSyncIntervalHours).toBe(0)
    })
  })
})
