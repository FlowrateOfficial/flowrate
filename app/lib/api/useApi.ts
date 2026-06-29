// ANCHOR: Typed HTTP client with CSRF and dedupe
import type { FetchOptions } from 'ofetch'
import { CSRF_COOKIE, CSRF_HEADER } from '#shared/security'
import { readCsrfTokenFromDocument } from '~/utils/csrf'
import { buildRequestKey, dedupeRequest } from './dedupe'

export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export interface ApiRequestOptions extends Omit<FetchOptions, 'method' | 'body'> {
  method?: ApiMethod
  body?: unknown
  noSpace?: boolean
  noDedupe?: boolean
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
    const { noSpace, noDedupe, method, body, query, headers, ...rest } = options
    const verb = method ?? 'GET'
    const spaceId = noSpace ? null : spacesStore.space?.id

    const run = () => http<T>(url, {
      method: verb,
      body: body as BodyInit | Record<string, unknown> | null | undefined,
      query,
      ...rest,
      headers: {
        ...(noSpace ? {} : spacesStore.spaceHeaders()),
        ...(verb !== 'GET' ? mutationHeaders() : {}),
        ...(headers as Record<string, string> | undefined)
      }
    })

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
