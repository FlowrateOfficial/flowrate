// ANCHOR: Feedback submission service
import type { H3Event } from 'h3'
import type { z } from 'zod'
import {
  FEEDBACK_LIMITS,
  feedbackLabelsForType,
  inferFeedbackMimeType
} from '#shared/feedback'
import { feedbackPayloadSchema } from '../schemas/api'
import { createFeedbackIssue, isGitHubFeedbackConfigured } from '../github/issues'
import { saveFeedbackSubmission } from '../github/submissions'
import { formatGithubError } from '../github/errors'
import { rateLimit } from '../security/rate-limit'
import { findUserFeedbackContext } from '../repositories/user.repository'

type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>

function maxBytesForMime(mime: string): number {
  return mime.startsWith('video/')
    ? FEEDBACK_LIMITS.maxVideoBytes
    : FEEDBACK_LIMITS.maxImageBytes
}

export async function submitFeedback(
  event: H3Event,
  user: { id: string, email: string, name: string | null },
  config: {
    githubToken?: string
    githubFeedbackRepo?: string
  }
) {
  if (!isGitHubFeedbackConfigured(config)) {
    throw createError({
      statusCode: 503,
      message: 'Feedback is not configured on this deployment'
    })
  }

  await rateLimit(event, `feedback:${user.id}`, { max: 8, windowMs: 60 * 60 * 1000 })
  await rateLimit(event, 'feedback:ip', { max: 20, windowMs: 60 * 60 * 1000 })

  const parts = await readMultipartFormData(event)
  if (!parts?.length) {
    throw createError({ statusCode: 400, message: 'Expected multipart form data' })
  }

  const payloadPart = parts.find(part => part.name === 'payload' && part.data)
  if (!payloadPart?.data) {
    throw createError({ statusCode: 400, message: 'Missing feedback payload' })
  }

  const { z: zod } = await import('zod')
  let payload: FeedbackPayload
  try {
    payload = feedbackPayloadSchema.parse(JSON.parse(payloadPart.data.toString('utf8')))
  } catch (error) {
    const detail = error instanceof zod.ZodError
      ? error.issues.map(issue => `${issue.path.join('.') || 'payload'}: ${issue.message}`).join('; ')
      : null
    throw createError({
      statusCode: 400,
      message: import.meta.dev && detail
        ? `Invalid feedback payload (${detail})`
        : 'Invalid feedback payload'
    })
  }

  const allowedIds = new Set(payload.attachmentIds ?? [])
  const fileParts = parts.filter(part =>
    part.name?.startsWith('attachment_')
    && part.data
    && part.filename
  )

  if (fileParts.length > FEEDBACK_LIMITS.maxAttachments) {
    throw createError({ statusCode: 400, message: 'Too many attachments' })
  }

  const attachments = []
  for (const part of fileParts) {
    const id = part.name!.slice('attachment_'.length)
    if (allowedIds.size && !allowedIds.has(id)) {
      continue
    }

    const mimeType = inferFeedbackMimeType(part.filename!, part.type)
    if (!mimeType) {
      throw createError({ statusCode: 400, message: `Unsupported file type: ${part.filename}` })
    }

    const data = Buffer.from(part.data!)
    if (data.byteLength > maxBytesForMime(mimeType)) {
      throw createError({ statusCode: 400, message: 'Attachment exceeds size limit' })
    }

    attachments.push({
      id,
      filename: part.filename!,
      mimeType,
      data
    })
  }

  const profile = await findUserFeedbackContext(user.id)
  const spaceRole = profile?.space?.members[0]?.role ?? null

  const locale = getCookie(event, 'user-locale')
    ?? getRequestHeader(event, 'accept-language')?.split(',')[0]
    ?? null

  let issueNumber: number
  try {
    const result = await createFeedbackIssue(
      config.githubToken!,
      config.githubFeedbackRepo!,
      {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        rating: payload.rating,
        attachments,
        context: payload.includeContext
          ? {
              userId: user.id,
              email: user.email,
              name: user.name,
              plan: profile?.plan ?? 'FREE',
              spaceName: profile?.space?.name ?? null,
              spaceType: profile?.space?.type ?? null,
              spaceRole,
              locale,
              path: payload.path ?? null,
              userAgent: getRequestHeader(event, 'user-agent') ?? null
            }
          : undefined
      }
    )
    issueNumber = result.issueNumber

    await saveFeedbackSubmission({
      userId: user.id,
      issueNumber,
      type: payload.type,
      title: payload.title,
      labels: feedbackLabelsForType(payload.type).filter(
        (name): name is 'USER_BUG' | 'USER_FEATURE' => name === 'USER_BUG' || name === 'USER_FEATURE'
      )
    })
  } catch (error) {
    const detail = formatGithubError(error)
    console.error('[feedback] GitHub error:', detail)
    throw createError({
      statusCode: 502,
      message: import.meta.dev
        ? `Could not submit feedback: ${detail}`
        : 'Could not submit feedback. Please try again later.'
    })
  }

  return { ok: true, issueNumber }
}
