// NOTE - ANCHOR: Feedback submission limits and GitHub issue comment anchors

export const FEEDBACK_ATTACH_PREFIX = 'flowrate-attach:'

export const FEEDBACK_ANCHORS = {
  description: '<!-- flowrate:description -->',
  context: '<!-- flowrate:context -->',
  attachments: '<!-- flowrate:attachments -->',
  reply: '<!-- flowrate:reply -->'
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

// NOTE - Orphan branch for feedback media only — never merged into app code (see docs/feedback-issues-medias-branch.md)
export const FEEDBACK_MEDIA_BRANCH = 'issues_medias'

/** How long list metadata is served from DB before refreshing from GitHub */
export const FEEDBACK_SYNC_TTL_MS = 5 * 60 * 1000

/** Max parallel GitHub sync requests when refreshing stale submissions */
export const FEEDBACK_SYNC_CONCURRENCY = 5

/** Max parallel asset uploads when creating an issue */
export const FEEDBACK_UPLOAD_CONCURRENCY = 4

/** @deprecated Use FEEDBACK_MEDIA_BRANCH */
export const FEEDBACK_UPLOAD_BRANCH = FEEDBACK_MEDIA_BRANCH

export type FeedbackType = 'review' | 'feature' | 'bug'

/** Applied automatically to every in-app submission */
export const FEEDBACK_AUTO_LABEL = 'from-app'

/** Labels users can pick when submitting feedback */
export const FEEDBACK_USER_LABELS = ['USER_BUG', 'USER_FEATURE'] as const
export type FeedbackUserLabel = typeof FEEDBACK_USER_LABELS[number]

/** Hidden in the app UI — used for internal tracking only */
export const FEEDBACK_HIDDEN_LABELS = new Set<string>([FEEDBACK_AUTO_LABEL])

export const FEEDBACK_TYPE_USER_LABEL: Partial<Record<FeedbackType, FeedbackUserLabel>> = {
  bug: 'USER_BUG',
  feature: 'USER_FEATURE'
}

export function feedbackLabelsForType(type: FeedbackType): string[] {
  const labels = [FEEDBACK_AUTO_LABEL]
  const userLabel = FEEDBACK_TYPE_USER_LABEL[type]
  if (userLabel) labels.push(userLabel)
  return labels
}

export function isFeedbackUserLabel(value: string): value is FeedbackUserLabel {
  return (FEEDBACK_USER_LABELS as readonly string[]).includes(value)
}

export interface FeedbackLabel {
  name: string
  color: string
  description?: string | null
}

export function filterFeedbackDisplayLabels(labels: FeedbackLabel[]): FeedbackLabel[] {
  return labels.filter(label => !FEEDBACK_HIDDEN_LABELS.has(label.name))
}

const EXTENSION_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v'
}

export function inferFeedbackMimeType(filename: string, reportedType?: string | null): string | null {
  const normalized = reportedType?.split(';')[0]?.trim().toLowerCase()
  if (normalized && (FEEDBACK_IMAGE_TYPES.has(normalized) || FEEDBACK_VIDEO_TYPES.has(normalized))) {
    return normalized
  }

  const ext = filename.split('.').pop()?.toLowerCase()
  if (!ext) return null

  const inferred = EXTENSION_MIME[ext]
  if (!inferred) return null
  if (FEEDBACK_IMAGE_TYPES.has(inferred) || FEEDBACK_VIDEO_TYPES.has(inferred)) {
    return inferred
  }
  return null
}

export function isFeedbackMimeType(mime: string): boolean {
  return FEEDBACK_IMAGE_TYPES.has(mime) || FEEDBACK_VIDEO_TYPES.has(mime)
}

/** Fix nested image markdown caused by replacing attach tokens inside title attributes */
export function repairFeedbackMarkdown(content: string): string {
  let result = content.trim()
  if (!result) return result

  const nestedImage = /!\[([^\]]*)]\(!\[([^\]]*)]\(([^)]+)\)(?:\s+"[^"]*")?\)/g
  while (nestedImage.test(result)) {
    result = result.replace(nestedImage, '![$1]($3)')
  }

  const attachTitle = new RegExp(
    `!\\[([^\\]]*)]\\((${FEEDBACK_ATTACH_PREFIX}[^)\\s]+)\\)\\s+"[^"]*"`,
    'g'
  )
  result = result.replace(attachTitle, '![$1]($2)')

  result = result.replace(
    /!\[([^\]]*)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_, alt, url) => `![${alt}](${githubFeedbackAssetUrl(url)})`
  )

  return result
}

/** Normalize legacy media URLs to github.com/blob/{ref}/path?raw=true */
export function githubFeedbackAssetUrl(url: string): string {
  try {
    const parsed = new URL(url)

    if (parsed.hostname === 'raw.githubusercontent.com') {
      const parts = parsed.pathname.split('/').filter(Boolean)
      if (parts.length >= 4) {
        const [owner, repo, ref, ...pathParts] = parts
        const path = pathParts.join('/')
        return `https://github.com/${owner}/${repo}/blob/${ref}/${path}?raw=true`
      }
      return url
    }

    if (parsed.hostname === 'github.com') {
      const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/)
      if (match) {
        const [, owner, repo, ref, path] = match
        return `https://github.com/${owner}/${repo}/blob/${ref}/${path}?raw=true`
      }
    }

    return url
  } catch {
    return url
  }
}

/** In-app img src — private repo blobs must be proxied with GITHUB_TOKEN */
export function githubFeedbackMediaProxyPath(url: string): string | null {
  try {
    const parsed = new URL(url)

    if (parsed.hostname === 'github.com') {
      const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/)
      if (!match) return null
      const ref = match[3]
      const path = match[4]
      if (!ref || !path) return null
      return `/api/feedback/media?ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(path)}`
    }

    if (parsed.hostname === 'raw.githubusercontent.com') {
      const parts = parsed.pathname.split('/').filter(Boolean)
      if (parts.length < 4) return null
      const ref = parts[2]
      const path = parts.slice(3).join('/')
      if (!ref || !path) return null
      return `/api/feedback/media?ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(path)}`
    }

    return null
  } catch {
    return null
  }
}
