import { describe, expect, it } from 'vitest'
import { maskPhoneHint, resolveAccountDeleteAuthRequirements } from './account-delete'

describe('resolveAccountDeleteAuthRequirements', () => {
  it('requires password for credential-only accounts', () => {
    expect(resolveAccountDeleteAuthRequirements(['credential'])).toEqual({
      oauthProviders: [],
      requiresPassword: true
    })
  })

  it('does not require password for OAuth-only accounts', () => {
    expect(resolveAccountDeleteAuthRequirements(['google'])).toEqual({
      oauthProviders: ['google'],
      requiresPassword: false
    })
  })

  it('does not require password when OAuth is linked even if credential exists', () => {
    expect(resolveAccountDeleteAuthRequirements(['google', 'credential'])).toEqual({
      oauthProviders: ['google'],
      requiresPassword: false
    })
  })
})

describe('maskPhoneHint', () => {
  it('masks all but the last four digits', () => {
    expect(maskPhoneHint('+14155552671')).toBe('•••• 2671')
  })
})
