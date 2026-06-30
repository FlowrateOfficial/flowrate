import { describe, expect, it } from 'vitest'
import { createEvent, getResponseHeader } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { isNotModified, respondWithPrivateCache, weakEtag } from './cache'

function mockEvent(ifNoneMatch?: string) {
  const req = new IncomingMessage(new Socket())
  if (ifNoneMatch) req.headers['if-none-match'] = ifNoneMatch
  const res = new ServerResponse(req)
  return createEvent(req, res)
}

describe('weakEtag', () => {
  it('is stable for the same payload', () => {
    const payload = { a: 1, b: 'x' }
    expect(weakEtag(payload)).toBe(weakEtag(payload))
  })

  it('changes when payload changes', () => {
    expect(weakEtag({ a: 1 })).not.toBe(weakEtag({ a: 2 }))
  })
})

describe('isNotModified', () => {
  it('sets private cache headers on every response', () => {
    const event = mockEvent()
    const payload = { ok: true }

    isNotModified(event, payload)

    expect(getResponseHeader(event, 'etag')).toMatch(/^W\/"/)
    expect(getResponseHeader(event, 'cache-control')).toBe('private, max-age=30, must-revalidate')
  })

  it('returns 304 when If-None-Match matches', () => {
    const payload = { items: [1, 2, 3] }
    const etag = weakEtag(payload)
    const event = mockEvent(etag)

    const notModified = isNotModified(event, payload)

    expect(notModified).toBe(true)
    expect(event.node.res.statusCode).toBe(304)
  })
})

describe('respondWithPrivateCache', () => {
  it('returns null when client cache is fresh', () => {
    const payload = { x: 1 }
    const event = mockEvent(weakEtag(payload))

    expect(respondWithPrivateCache(event, payload)).toBeNull()
  })

  it('returns payload when cache is stale', () => {
    const payload = { x: 1 }
    const event = mockEvent()

    expect(respondWithPrivateCache(event, payload)).toEqual(payload)
  })
})
