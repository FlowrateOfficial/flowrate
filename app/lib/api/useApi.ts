import type { FetchOptions } from 'ofetch'
import { buildRequestKey, dedupeRequest } from './dedupe'

export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export interface ApiRequestOptions extends Omit<FetchOptions, 'method' | 'body'> {
  method?: ApiMethod
  body?: unknown
  /** Do not attach active-space header (global/user routes). */
  noSpace?: boolean
  /** Skip in-flight deduplication for this request. */
  noDedupe?: boolean
}

/**
 * Single HTTP entry point for the app.
 * Forwards cookies on SSR and attaches the active financial space header.
 */
export function useApi() {
  const http = useApiFetch()
  const spacesStore = useSpacesStore()

  async function api<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    const { noSpace, noDedupe, method, body, query, headers, ...rest } = options
    const verb = method ?? 'GET'
    const spaceId = noSpace ? null : spacesStore.activeSpace?.id

    const run = () => http<T>(url, {
      method: verb,
      body: body as BodyInit | Record<string, unknown> | null | undefined,
      query,
      ...rest,
      headers: {
        ...(noSpace ? {} : spacesStore.spaceHeaders()),
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
