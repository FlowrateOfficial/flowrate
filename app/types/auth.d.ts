// NOTE - ANCHOR: Neon Auth session types (client)
export interface NeonAuthUser {
  id: string
  email: string
  name: string | null
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface NeonAuthSessionData {
  user: NeonAuthUser
  session: {
    id: string
    userId: string
    expiresAt: string
  }
}

