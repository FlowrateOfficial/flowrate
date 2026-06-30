// ANCHOR: Private short-lived cache + weak ETag for GET APIs
import { createHash } from 'node:crypto'
import { getRequestHeader, setResponseHeader, setResponseStatus, type H3Event } from 'h3'

export function weakEtag(payload: unknown): string {
  const hash = createHash('sha1')
    .update(JSON.stringify(payload))
    .digest('hex')
    .slice(0, 16)
  return `W/"${hash}"`
}

/** Sets cache headers; returns true when client sent matching If-None-Match */
export function isNotModified(event: H3Event, payload: unknown): boolean {
  const etag = weakEtag(payload)
  setResponseHeader(event, 'ETag', etag)
  setResponseHeader(event, 'Cache-Control', 'private, max-age=30, must-revalidate')

  const inm = getRequestHeader(event, 'if-none-match')
  if (inm && inm === etag) {
    setResponseStatus(event, 304, 'Not Modified')
    return true
  }
  return false
}

export function respondWithPrivateCache<T>(event: H3Event, payload: T): T | null {
  if (isNotModified(event, payload)) return null
  return payload
}
