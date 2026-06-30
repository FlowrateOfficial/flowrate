import { describe, expect, it } from 'vitest'
import { EMPTY_SYNC_RESULT, mergeSyncResults } from './results'

describe('mergeSyncResults', () => {
  it('sums imported transactions and accounts from both providers', () => {
    const merged = mergeSyncResults(
      { imported: 12, accounts: 2 },
      { imported: 5, accounts: 1 }
    )

    expect(merged).toEqual({ imported: 17, accounts: 3 })
  })

  it('treats empty provider results as zero', () => {
    expect(mergeSyncResults(EMPTY_SYNC_RESULT, { imported: 3, accounts: 1 })).toEqual({
      imported: 3,
      accounts: 1
    })
  })
})
