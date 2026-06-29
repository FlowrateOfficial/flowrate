import { z } from 'zod'
import {
  FEEDBACK_IMAGE_TYPES,
  FEEDBACK_LIMITS,
  FEEDBACK_VIDEO_TYPES
} from '#shared/feedback'
import { requireSessionUser } from '../lib/auth'
import { createFeedbackIssue, isGitHubFeedbackConfigured } from '../lib/github/issues'
import { formatGithubError } from '../lib/github/errors'
import { rateLimit } from '../lib/security/rate-limit'

const payloadSchema = z.object({
  type: z.enum(['review', 'feature', 'bug']),
  title: z.string().trim().min(3).max(FEEDBACK_LIMITS.maxTitleLength),
  message: z.string().trim().min(10).max(FEEDBACK_LIMITS.maxMessageLength),
  rating: z.number().int().min(1).max(5).optional(),
  includeContext: z.boolean().optional().default(true),
  path: z.string().max(200).optional(),
  attachmentIds: z.array(z.string().min(1).max(80)).max(FEEDBACK_LIMITS.maxAttachments).optional()
}).superRefine((data, ctx) => {
  if (data.type === 'review' && data.rating == null) {
    ctx.addIssue({
      code: 'custom',
      message: 'Rating is required for reviews',
      path: ['rating']
    })
  }
})

function isAllowedMime(mime: string): boolean {
  return FEEDBACK_IMAGE_TYPES.has(mime) || FEEDBACK_VIDEO_TYPES.has(mime)
}

function maxBytesForMime(mime: string): number {
  return mime.startsWith('video/')
    ? FEEDBACK_LIMITS.maxVideoBytes
    : FEEDBACK_LIMITS.maxImageBytes
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!isGitHubFeedbackConfigured(config)) {
    throw createError({
      statusCode: 503,
      message: 'Feedback is not configured on this deployment'
    })
  }

  const user = await requireSessionUser(event)
  rateLimit(event, `feedback:${user.id}`, { max: 8, windowMs: 60 * 60 * 1000 })
  rateLimit(event, 'feedback:ip', { max: 20, windowMs: 60 * 60 * 1000 })

  const parts = await readMultipartFormData(event)
  if (!parts?.length) {
    throw createError({ statusCode: 400, message: 'Expected multipart form data' })
  }

  const payloadPart = parts.find(part => part.name === 'payload' && part.data)
  if (!payloadPart?.data) {
    throw createError({ statusCode: 400, message: 'Missing feedback payload' })
  }

  let payload: z.infer<typeof payloadSchema>
  try {
    payload = payloadSchema.parse(JSON.parse(payloadPart.data.toString('utf8')))
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid feedback payload' })
  }

  const allowedIds = new Set(payload.attachmentIds ?? [])
  const fileParts = parts.filter(part =>
    part.name?.startsWith('attachment_')
    && part.data
    && part.filename
    && part.type
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

    const mimeType = part.type!
    if (!isAllowedMime(mimeType)) {
      throw createError({ statusCode: 400, message: `Unsupported file type: ${mimeType}` })
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

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      plan: true,
      space: { select: { id: true, name: true, type: true } }
    }
  })

  let spaceRole: string | null = null
  if (profile?.space) {
    const member = await prisma.spaceMember.findFirst({
      where: {
        userId: user.id,
        spaceId: profile.space.id,
        status: 'ACTIVE'
      },
      select: { role: true }
    })
    spaceRole = member?.role ?? null
  }

  const locale = getCookie(event, 'user-locale')
    ?? getRequestHeader(event, 'accept-language')?.split(',')[0]
    ?? null

  let issueNumber: number
  try {
    const result = await createFeedbackIssue(
      config.githubToken,
      config.githubFeedbackRepo,
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

  return {
    ok: true,
    issueNumber
  }
})
