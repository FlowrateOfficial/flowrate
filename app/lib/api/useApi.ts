import type { FetchOptions } from 'ofetch'

export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export interface ApiRequestOptions extends Omit<FetchOptions, 'method' | 'body'> {
  method?: ApiMethod
  body?: unknown
  /** Do not attach active-space header (global/user routes). */
  noSpace?: boolean
}

/**
 * Single HTTP entry point for the app.
 * Forwards cookies on SSR and attaches the active financial space header.
 */
export function useApi() {
  const http = useApiFetch()
  const spacesStore = useSpacesStore()

  async function api<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    const { noSpace, method, body, headers, ...rest } = options

    return http<T>(url, {
      method: method ?? 'GET',
      body: body as BodyInit | Record<string, unknown> | null | undefined,
      ...rest,
      headers: {
        ...(noSpace ? {} : spacesStore.spaceHeaders()),
        ...(headers as Record<string, string> | undefined)
      }
    })
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
