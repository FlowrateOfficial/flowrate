// ANCHOR: Post sign-in bootstrap — ensure User row and default space
import { requireAuthUser } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  return {
    id: user.id,
    email: user.email,
    name: user.name
  }
})
