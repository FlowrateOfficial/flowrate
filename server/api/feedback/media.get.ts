import { inferFeedbackMimeType } from '#shared/feedback'
import { requireSessionUser } from '../../lib/auth'
import { isGitHubFeedbackConfigured } from '../../lib/github/issues'
import { getFeedbackSubmissionForUser } from '../../lib/github/submissions'
import { githubHeaders, parseGitHubRepo } from '../../lib/github/client'
import { rateLimit } from '../../lib/security/rate-limit'

function issueNumberFromMediaPath(path: string): number | null {
  const match = path.match(/^(?:feedback\/)?issues\/(\d+)\//)
  if (!match) return null
  const issueNumber = Number(match[1])
  return Number.isInteger(issueNumber) && issueNumber > 0 ? issueNumber : null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!isGitHubFeedbackConfigured(config)) {
    throw createError({ statusCode: 503, message: 'Feedback media is not configured' })
  }

  const user = await requireSessionUser(event)
  rateLimit(event, `feedback:media:${user.id}`, { max: 120, windowMs: 60 * 1000 })

  const query = getQuery(event)
  const path = String(query.path ?? '').trim()
  const ref = String(query.ref ?? '').trim()

  if (!path || !ref || path.includes('..') || ref.includes('..')) {
    throw createError({ statusCode: 400, message: 'Invalid media path' })
  }

  if (!path.startsWith('issues/') && !path.startsWith('feedback/issues/')) {
    throw createError({ statusCode: 400, message: 'Invalid media path' })
  }

  const issueNumber = issueNumberFromMediaPath(path)
  if (!issueNumber) {
    throw createError({ statusCode: 400, message: 'Invalid issue media path' })
  }

  const submission = await getFeedbackSubmissionForUser(user.id, issueNumber)
  if (!submission) {
    throw createError({ statusCode: 404, message: 'Media not found' })
  }

  const { owner, name } = parseGitHubRepo(config.githubFeedbackRepo)

  try {
    const file = await $fetch<{ content: string, encoding: string }>(
      `https://api.github.com/repos/${owner}/${name}/contents/${path}`,
      {
        headers: githubHeaders(config.githubToken),
        query: { ref }
      }
    )

    if (file.encoding !== 'base64') {
      throw createError({ statusCode: 502, message: 'Unexpected media encoding' })
    }

    const mimeType = inferFeedbackMimeType(path) ?? 'application/octet-stream'
    const data = Buffer.from(file.content, 'base64')

    setHeader(event, 'Content-Type', mimeType)
    setHeader(event, 'Cache-Control', 'private, max-age=3600')
    setHeader(event, 'X-Content-Type-Options', 'nosniff')

    return data
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 404, message: 'Media not found' })
  }
})
