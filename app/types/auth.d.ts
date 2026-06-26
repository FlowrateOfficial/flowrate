// FlowRate user type — reflects the session data returned by Neon Auth (Better Auth).
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

