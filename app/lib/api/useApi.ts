// ANCHOR: Typed HTTP client with CSRF, dedupe, and ETag cache
import type { FetchOptions } from 'ofetch'
import { CSRF_COOKIE, CSRF_HEADER } from '#shared/security'
import { readCsrfTokenFromDocument } from '~/utils/csrf'
import { buildRequestKey, dedupeRequest } from './dedupe'
import { getEtagEntry, setEtagEntry } from './etag-cache'

export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export interface ApiRequestOptions extends Omit<FetchOptions, 'method' | 'body'> {
  method?: ApiMethod
  body?: unknown
  noSpace?: boolean
  noDedupe?: boolean
  noCache?: boolean
}

export function useApi() {
  const http = useApiFetch()
  const spacesStore = useSpacesStore()
  const csrfCookie = import.meta.client ? useCookie<string | null>(CSRF_COOKIE) : ref(null)

  function mutationHeaders(): Record<string, string> {
    const token = csrfCookie.value ?? readCsrfTokenFromDocument()
    return token ? { [CSRF_HEADER]: token } : {}
  }

  async function api<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    const { noSpace, noDedupe, noCache, method, body, query, headers, ...rest } = options
    const verb = method ?? 'GET'
    const spaceId = noSpace ? null : spacesStore.space?.id

    const requestHeaders = {
      ...(noSpace ? {} : spacesStore.spaceHeaders()),
      ...(verb !== 'GET' ? mutationHeaders() : {}),
      ...(headers as Record<string, string> | undefined)
    }

    const run = async () => {
      if (verb === 'GET' && !noCache) {
        const key = buildRequestKey(verb, url, spaceId, query as Record<string, unknown> | undefined)
        const cached = getEtagEntry(key)
        const response = await http.raw<T>(url, {
          method: verb,
          query,
          ...rest,
          headers: {
            ...requestHeaders,
            ...(cached?.etag ? { 'If-None-Match': cached.etag } : {})
          }
        })

        if (response.status === 304 && cached) {
          return cached.data as T
        }

        const etag = response.headers.get('etag')
        if (etag && response._data !== undefined) {
          setEtagEntry(key, etag, response._data)
        }

        return response._data as T
      }

      return http<T>(url, {
        method: verb,
        body: body as BodyInit | Record<string, unknown> | null | undefined,
        query,
        ...rest,
        headers: requestHeaders
      })
    }

    if (noDedupe || verb !== 'GET') {
      return run() as Promise<T>
    }

    const key = buildRequestKey(verb, url, spaceId, query as Record<string, unknown> | undefined)
    return dedupeRequest(key, run) as Promise<T>
  }

  return {
    api,
    get: <T>(url: string, query?: Record<string, unknown>) =>
      api<T>(url, { query }),
    post: <T>(url: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      api<T>(url, { method: 'POST', body, ...options }),
    patch: <T>(url: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      api<T>(url, { method: 'PATCH', body, ...options }),
    delete: <T>(url: string, options?: Omit<ApiRequestOptions, 'method'>) =>
      api<T>(url, { method: 'DELETE', ...options })
  }
}
