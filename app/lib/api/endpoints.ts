// ANCHOR: Client API route path constants
export const apiRoutes = {
  auth: {
    session: '/api/auth/get-session'
  },
  user: {
    bootstrap: '/api/user/bootstrap',
    profile: '/api/user/profile',
    stripeCustomer: '/api/user/stripe-customer',
    stripeInvoices: '/api/user/stripe-invoices',
    account: '/api/user/account',
    deleteChallenge: '/api/user/account/delete-challenge',
    phoneVerify: '/api/user/phone/verify',
    phoneResend: '/api/user/phone/resend'
  },
  spaces: {
    list: '/api/spaces',
    active: '/api/spaces/active',
    detail: (id: string) => `/api/spaces/${id}`,
    members: (id: string) => `/api/spaces/${id}/members`,
    member: (spaceId: string, memberId: string) => `/api/spaces/${spaceId}/members/${memberId}`,
    memberChild: (spaceId: string, memberId: string) => `/api/spaces/${spaceId}/members/${memberId}/child`,
    memberFinancial: (spaceId: string, memberId: string) => `/api/spaces/${spaceId}/members/${memberId}/financial`,
    createChild: (id: string) => `/api/spaces/${id}/members/create-child`,
    splits: (id: string) => `/api/spaces/${id}/splits`,
    businessOverview: (id: string) => `/api/spaces/${id}/company/burn-rate`
  },
  accounts: {
    list: '/api/accounts',
    delete: (id: string) => `/api/accounts/${id}`
  },
  transactions: {
    list: '/api/transactions',
    patch: (id: string) => `/api/transactions/${id}`,
    export: '/api/transactions/export'
  },
  budgets: {
    list: '/api/budgets',
    patch: (id: string) => `/api/budgets/${id}`,
    delete: (id: string) => `/api/budgets/${id}`
  },
  subscriptions: {
    list: '/api/subscriptions'
  },
  analytics: {
    overview: '/api/analytics/overview'
  },
  dashboard: {
    stats: '/api/dashboard/stats',
    overview: '/api/dashboard/overview'
  },
  teen: {
    dashboard: '/api/teen/dashboard'
  },
  invitations: {
    detail: (token: string) => `/api/invitations/${token}`,
    accept: (token: string) => `/api/invitations/${token}/accept`,
    verifyPhone: (token: string) => `/api/invitations/${token}/verify-phone`,
    resendPhone: (token: string) => `/api/invitations/${token}/resend-phone`,
    complete: (token: string) => `/api/invitations/${token}/complete`
  },
  stripe: {
    plans: '/api/stripe/plans',
    connectBank: '/api/stripe/connect-bank',
    syncAccounts: '/api/stripe/sync-accounts',
    syncTransactions: '/api/stripe/sync-transactions',
    syncSubscription: '/api/stripe/sync-subscription',
    checkout: '/api/stripe/create-checkout-session',
    billingPortal: '/api/stripe/billing-portal',
    previewSubscriptionChange: '/api/stripe/preview-subscription-change',
    changeSubscription: '/api/stripe/change-subscription'
  },
  plaid: {
    linkToken: '/api/plaid/link-token',
    exchange: '/api/plaid/exchange',
    syncAccounts: '/api/plaid/sync-accounts',
    syncTransactions: '/api/plaid/sync-transactions'
  },
  fx: {
    rates: '/api/fx/rates'
  },
  feedback: '/api/feedback',
  feedbackDetail: (issueNumber: number) => `/api/feedback/${issueNumber}`
} as const
