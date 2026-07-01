// ANCHOR: Neon Auth session types (server)
export interface NeonAuthUser {
  id: string
  email: string
  name: string | null
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}
