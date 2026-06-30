import { switchActiveSpace } from '../../lib/services/spaces.service'
import { activeSpaceBodySchema } from '../../lib/schemas/api'

export default defineEventHandler(async (event) => {
  const user = await requireNeonAuth(event)
  const { spaceId } = await readValidatedBody(event, activeSpaceBodySchema.parse)
  return switchActiveSpace(event, user.id, spaceId)
})
