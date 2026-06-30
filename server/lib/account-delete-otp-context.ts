const DELETE_OTP_TTL_MS = 15 * 60_000
const pendingDeleteOtps = new Map<string, number>()

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function pruneStaleEntries(now = Date.now()): void {
  for (const [email, sentAt] of pendingDeleteOtps) {
    if (now - sentAt > DELETE_OTP_TTL_MS) {
      pendingDeleteOtps.delete(email)
    }
  }
}

export function markDeleteAccountOtp(email: string): void {
  pruneStaleEntries()
  pendingDeleteOtps.set(normalizeEmail(email), Date.now())
}

export function isDeleteAccountOtp(email: string): boolean {
  const key = normalizeEmail(email)
  const sentAt = pendingDeleteOtps.get(key)
  if (!sentAt) return false
  if (Date.now() - sentAt > DELETE_OTP_TTL_MS) {
    pendingDeleteOtps.delete(key)
    return false
  }
  return true
}

export function clearDeleteAccountOtp(email: string): void {
  pendingDeleteOtps.delete(normalizeEmail(email))
}
