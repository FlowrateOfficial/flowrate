// FlowRate user type for server-side Neon Auth (Better Auth) sessions.
export interface NeonAuthUser {
  id: string
  email: string
  name: string | null
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

