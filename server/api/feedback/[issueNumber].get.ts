import { requireSessionUser } from '../../lib/auth'
import { isGitHubFeedbackConfigured } from '../../lib/github/issues'
import { getFeedbackSubmissionForUser } from '../../lib/github/submissions'
import { fetchIssueThread } from '../../lib/github/thread'
import { rateLimit } from '../../lib/security/rate-limit'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!isGitHubFeedbackConfigured(config)) {
    throw createError({ statusCode: 503, message: 'Feedback is not configured' })
  }

  const user = await requireSessionUser(event)
  const issueNumber = Number(getRouterParam(event, 'issueNumber'))

  if (!Number.isInteger(issueNumber) || issueNumber < 1) {
    throw createError({ statusCode: 400, message: 'Invalid issue number' })
  }

  rateLimit(event, `feedback:thread:${user.id}`, { max: 40, windowMs: 60 * 1000 })

  const submission = await getFeedbackSubmissionForUser(user.id, issueNumber)
  if (!submission) {
    throw createError({ statusCode: 404, message: 'Feedback not found' })
  }

  try {
    const thread = await fetchIssueThread(
      config.githubToken,
      config.githubFeedbackRepo,
      issueNumber,
      submission.type
    )

    return { thread }
  } catch {
    throw createError({
      statusCode: 502,
      message: 'Could not load feedback replies'
    })
  }
})
