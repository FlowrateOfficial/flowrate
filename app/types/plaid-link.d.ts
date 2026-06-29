export interface PlaidLinkInstitution {
  name: string
  institution_id: string
}

export interface PlaidLinkAccount {
  id: string
  name: string
  mask: string | null
  type: string
  subtype: string | null
}

export interface PlaidLinkOnSuccessMetadata {
  institution: PlaidLinkInstitution | null
  accounts: PlaidLinkAccount[]
  link_session_id: string
}

export interface PlaidLinkOnExitMetadata {
  status: string | null
  link_session_id: string
  request_id: string
}

export interface PlaidLinkHandler {
  open: () => void
  exit: (options?: { force?: boolean }, callback?: () => void) => void
  destroy: () => void
}

export interface PlaidLinkOptions {
  token: string
  receivedRedirectUri?: string
  onSuccess: (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => void
  onExit?: (error: { error_code?: string, display_message?: string } | null, metadata: PlaidLinkOnExitMetadata) => void
  onLoad?: () => void
}

declare global {
  interface Window {
    Plaid?: {
      create: (options: PlaidLinkOptions) => PlaidLinkHandler
    }
  }
}

export {}
