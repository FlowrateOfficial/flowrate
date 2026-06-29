import { loadPlaidLink } from '~/lib/load-plaid'
import type { PlaidLinkOnSuccessMetadata } from '~/types/plaid-link'

export {
  isPlaidConnectCancelled,
  resolvePlaidLinkErrorMessage
} from '~/lib/plaid-errors'

const PLAID_LINK_TOKEN_KEY = 'flowrate_plaid_link_token'
const PLAID_CONNECT_VISIBILITY_KEY = 'flowrate_plaid_connect_visibility'

export function storePlaidLinkSession(linkToken: string, visibility: 'PERSONAL' | 'SHARED') {
  sessionStorage.setItem(PLAID_LINK_TOKEN_KEY, linkToken)
  sessionStorage.setItem(PLAID_CONNECT_VISIBILITY_KEY, visibility)
}

export function readPlaidLinkSession(): { linkToken: string, visibility: 'PERSONAL' | 'SHARED' } | null {
  const linkToken = sessionStorage.getItem(PLAID_LINK_TOKEN_KEY)
  const visibility = sessionStorage.getItem(PLAID_CONNECT_VISIBILITY_KEY)
  if (!linkToken) return null
  return {
    linkToken,
    visibility: visibility === 'SHARED' ? 'SHARED' : 'PERSONAL'
  }
}

export function clearPlaidLinkSession() {
  sessionStorage.removeItem(PLAID_LINK_TOKEN_KEY)
  sessionStorage.removeItem(PLAID_CONNECT_VISIBILITY_KEY)
}

export async function openPlaidLink(options: {
  linkToken: string
  receivedRedirectUri?: string
}): Promise<{ publicToken: string, metadata: PlaidLinkOnSuccessMetadata }> {
  await loadPlaidLink()

  if (!window.Plaid) {
    throw new Error('Plaid Link failed to initialize')
  }

  return new Promise((resolve, reject) => {
    const handler = window.Plaid!.create({
      token: options.linkToken,
      ...(options.receivedRedirectUri ? { receivedRedirectUri: options.receivedRedirectUri } : {}),
      onSuccess: (publicToken, metadata) => {
        handler.destroy()
        resolve({ publicToken, metadata })
      },
      onExit: (error) => {
        handler.destroy()
        if (error) {
          reject(error)
          return
        }
        reject(Object.assign(new Error('Plaid Link closed'), { error_code: 'USER_EXIT' }))
      }
    })

    handler.open()
  })
}
