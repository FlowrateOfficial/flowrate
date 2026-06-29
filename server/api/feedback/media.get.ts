import { inferFeedbackMimeType } from '#shared/feedback'
import { requireSessionUser } from '../../lib/auth'
import { isGitHubFeedbackConfigured } from '../../lib/github/issues'
import { getFeedbackSubmissionForUser } from '../../lib/github/submissions'
import { githubHeaders, parseGitHubRepo } from '../../lib/github/client'
import { getCachedFeedbackMedia, setCachedFeedbackMedia } from '../../lib/github/media-cache'
import { rateLimit } from '../../lib/security/rate-limit'

interface GitHubContentsResponse {
  content: string
  encoding: string
  sha?: string
}

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

  const ifNoneMatch = getRequestHeader(event, 'if-none-match')
  const cached = getCachedFeedbackMedia(ref, path, ifNoneMatch)

  if (cached === 'not-modified') {
    setHeader(event, 'Cache-Control', 'private, max-age=3600')
    setResponseStatus(event, 304)
    return null
  }

  if (cached) {
    setHeader(event, 'Content-Type', cached.mimeType)
    setHeader(event, 'Cache-Control', 'private, max-age=3600')
    setHeader(event, 'ETag', cached.etag)
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    return cached.body
  }

  const { owner, name } = parseGitHubRepo(config.githubFeedbackRepo)

  try {
    const file = await $fetch<GitHubContentsResponse>(
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
    const etag = setCachedFeedbackMedia(ref, path, data, mimeType, file.sha)

    if (ifNoneMatch && ifNoneMatch === etag) {
      setHeader(event, 'Cache-Control', 'private, max-age=3600')
      setHeader(event, 'ETag', etag)
      setResponseStatus(event, 304)
      return null
    }

    setHeader(event, 'Content-Type', mimeType)
    setHeader(event, 'Cache-Control', 'private, max-age=3600')
    setHeader(event, 'ETag', etag)
    setHeader(event, 'X-Content-Type-Options', 'nosniff')

    return data
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({ statusCode: 404, message: 'Media not found' })
  }
})
