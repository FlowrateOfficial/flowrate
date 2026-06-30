import { toSpaceContext } from '../../lib/domain/context'
import { getTeenDashboard } from '../../lib/services/teen.service'
import { respondWithPrivateCache } from '../../lib/http/cache'

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event, { withChildProfile: true })
  const ctx = toSpaceContext(
    { id: user.id, email: user.email, name: user.name ?? null },
    space,
    membership
  )

  const payload = await getTeenDashboard(ctx, membership)
  return respondWithPrivateCache(event, payload) ?? undefined
})
