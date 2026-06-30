import { requireSessionUser } from '../lib/auth'
import { isGitHubFeedbackConfigured } from '../lib/github/issues'
import { listFeedbackSubmissions } from '../lib/github/submissions'
import { rateLimit } from '../lib/security/rate-limit'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const enabled = isGitHubFeedbackConfigured(config)

  if (!enabled) {
    return { enabled: false, submissions: [] }
  }

  const user = await requireSessionUser(event)
  await rateLimit(event, `feedback:list:${user.id}`, { max: 30, windowMs: 60 * 1000 })

  const query = getQuery(event)
  const refresh = query.refresh === 'true' || query.refresh === '1'

  const submissions = await listFeedbackSubmissions(
    config.githubToken,
    config.githubFeedbackRepo,
    user.id,
    { refresh }
  )

  return {
    enabled: true,
    submissions
  }
})
