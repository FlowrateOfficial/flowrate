import { requireAuthUser } from '../../lib/auth'

/**
 * After Neon Auth sign-in (email or OAuth), ensure the app User row and default space exist.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  return {
    id: user.id,
    email: user.email,
    name: user.name
  }
})
