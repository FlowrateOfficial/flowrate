// ANCHOR: E.164 phone normalization
const E164_REGEX = /^\+[1-9]\d{1,14}$/

// NOTE - Strip trunk zero after country code (+330… → +33…, +440… → +44…, etc.)
function stripTrunkZeroAfterCountryCode(candidate: string): string {
  const fr = candidate.match(/^\+33(0)(\d{9})$/)
  if (fr) return `+33${fr[2]}`

  const uk = candidate.match(/^\+44(0)(\d{9,10})$/)
  if (uk) return `+44${uk[2]}`

  const it = candidate.match(/^\+39(0)(\d{6,10})$/)
  if (it) return `+39${it[2]}`

  const de = candidate.match(/^\+49(0)(\d{6,11})$/)
  if (de) return `+49${de[2]}`

  const es = candidate.match(/^\+34(0)(\d{9})$/)
  if (es) return `+34${es[2]}`

  return candidate
}

export function normalizePhone(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return null

  let candidate: string | null = null

  if (trimmed.startsWith('+')) {
    candidate = `+${digits}`
  } else if (digits.length === 10) {
    // NOTE - US 10-digit local → +1XXXXXXXXXX
    candidate = `+1${digits}`
  } else if (digits.length === 11 && digits.startsWith('1')) {
    candidate = `+${digits}`
  } else if (digits.length === 10 && digits.startsWith('0')) {
    // NOTE - French local 0987765432 → +33987765432
    candidate = `+33${digits.slice(1)}`
  } else if (digits.length === 11 && digits.startsWith('33')) {
    candidate = `+${digits}`
  } else {
    candidate = `+${digits}`
  }

  if (!candidate) return null

  candidate = stripTrunkZeroAfterCountryCode(candidate)
  return E164_REGEX.test(candidate) ? candidate : null
}

export function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone)
}

export function formatPhoneDisplay(phone: string): string {
  if (phone.startsWith('+33') && phone.length === 12) {
    const n = phone.slice(3)
    return `+33 ${n.slice(0, 1)} ${n.slice(1, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7)}`
  }
  if (!phone.startsWith('+1') || phone.length !== 12) return phone
  const n = phone.slice(2)
  return `+1 (${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`
}
