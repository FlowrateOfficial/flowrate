import { requireSessionUser } from '../lib/auth'
import { submitFeedback } from '../lib/services/feedback.service'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const user = await requireSessionUser(event)

  return submitFeedback(event, user, {
    githubToken: config.githubToken,
    githubFeedbackRepo: config.githubFeedbackRepo
  })
})
