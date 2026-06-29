// NOTE - ANCHOR: Feedback submission limits and GitHub issue comment anchors

export const FEEDBACK_ATTACH_PREFIX = 'flowrate-attach:'

export const FEEDBACK_ANCHORS = {
  description: '<!-- flowrate:description -->',
  context: '<!-- flowrate:context -->',
  attachments: '<!-- flowrate:attachments -->'
} as const

export const FEEDBACK_LIMITS = {
  maxAttachments: 8,
  maxImageBytes: 8 * 1024 * 1024,
  maxVideoBytes: 48 * 1024 * 1024,
  maxMessageLength: 12_000,
  maxTitleLength: 120
} as const

export const FEEDBACK_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif'
])

export const FEEDBACK_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v'
])
