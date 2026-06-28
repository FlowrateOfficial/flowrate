interface StripeFinancialConnectionsSession {
  accounts?: Array<{ id: string }> | {
    object?: string
    data?: Array<{ id: string }>
    has_more?: boolean
  }
}

interface StripeInstance {
  collectFinancialConnectionsAccounts: (options: {
    clientSecret: string
  }) => Promise<{ financialConnectionsSession?: StripeFinancialConnectionsSession }>
}

interface StripeConstructor {
  (publishableKey: string): StripeInstance
}

declare global {
  interface Window {
    Stripe?: StripeConstructor
  }
}

export {}
