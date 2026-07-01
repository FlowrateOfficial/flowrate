// ANCHOR: feedback limits + GitHub issue anchors

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

// NOTE - media on orphan branch issues_medias (never merged)
export const FEEDBACK_MEDIA_BRANCH = 'issues_medias'

// NOTE - list cache TTL
export const FEEDBACK_SYNC_TTL_MS = 5 * 60 * 1000

// NOTE - parallel GitHub sync cap
export const FEEDBACK_SYNC_CONCURRENCY = 5

// NOTE - parallel upload cap per issue
export const FEEDBACK_UPLOAD_CONCURRENCY = 4

export type FeedbackType = 'review' | 'feature' | 'bug'

// NOTE - always applied
export const FEEDBACK_AUTO_LABEL = 'from-app'

// NOTE - user-picked labels
export const FEEDBACK_USER_LABELS = ['USER_BUG', 'USER_FEATURE'] as const
export type FeedbackUserLabel = typeof FEEDBACK_USER_LABELS[number]

// NOTE - hidden in UI
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

export const FEEDBACK_USER_LABEL_COLORS: Record<FeedbackUserLabel, string> = {
  USER_BUG: 'd73a4a',
  USER_FEATURE: '0e8a16'
}

export function feedbackUserLabelDisplay(name: FeedbackUserLabel): FeedbackLabel {
  return { name, color: FEEDBACK_USER_LABEL_COLORS[name] }
}

function defaultFeedbackLabelColor(name: string): string {
  return isFeedbackUserLabel(name) ? FEEDBACK_USER_LABEL_COLORS[name] : '6b7280'
}

export interface FeedbackLabel {
  name: string
  color: string
  description?: string | null
}

// NOTE - legacy labelsJson shapes
export function feedbackDisplayLabelsFromJson(labelsJson: string): FeedbackLabel[] {
  try {
    const parsed = JSON.parse(labelsJson)
    if (!Array.isArray(parsed)) return []

    const labels: FeedbackLabel[] = []
    for (const entry of parsed) {
      if (typeof entry === 'string') {
        if (isFeedbackUserLabel(entry)) {
          labels.push(feedbackUserLabelDisplay(entry))
        }
        continue
      }

      if (!entry || typeof entry !== 'object' || typeof entry.name !== 'string') continue
      const name = entry.name
      if (FEEDBACK_HIDDEN_LABELS.has(name)) continue

      const color = typeof entry.color === 'string' && entry.color.length > 0
        ? entry.color.replace('#', '')
        : defaultFeedbackLabelColor(name)

      labels.push({
        name,
        color,
        description: entry.description ?? null
      })
    }

    return labels
  } catch {
    return []
  }
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

// NOTE - fix nested img markdown after attach tokens
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

// NOTE - normalize blob URLs to ?raw=true
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

// NOTE - proxy private blobs via /api/feedback/media
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
