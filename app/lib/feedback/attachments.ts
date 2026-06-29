// NOTE - ANCHOR: Client-side feedback attachment registry for editor uploads

import {
  FEEDBACK_ATTACH_PREFIX,
  FEEDBACK_IMAGE_TYPES,
  FEEDBACK_LIMITS,
  FEEDBACK_VIDEO_TYPES
} from '#shared/feedback'

export interface FeedbackAttachmentEntry {
  id: string
  file: File
  previewUrl: string
  mimeType: string
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createFeedbackAttachmentRegistry() {
  const entries = new Map<string, FeedbackAttachmentEntry>()

  function validateFile(file: File): string | null {
    if (!FEEDBACK_IMAGE_TYPES.has(file.type) && !FEEDBACK_VIDEO_TYPES.has(file.type)) {
      return 'unsupported'
    }
    const max = file.type.startsWith('video/')
      ? FEEDBACK_LIMITS.maxVideoBytes
      : FEEDBACK_LIMITS.maxImageBytes
    if (file.size > max) {
      return 'tooLarge'
    }
    if (entries.size >= FEEDBACK_LIMITS.maxAttachments) {
      return 'tooMany'
    }
    return null
  }

  function register(file: File): FeedbackAttachmentEntry | { error: string } {
    const validation = validateFile(file)
    if (validation) {
      return { error: validation }
    }

    const id = createId()
    const entry: FeedbackAttachmentEntry = {
      id,
      file,
      previewUrl: URL.createObjectURL(file),
      mimeType: file.type
    }
    entries.set(id, entry)
    return entry
  }

  function get(id: string) {
    return entries.get(id)
  }

  function list() {
    return [...entries.values()]
  }

  function clear() {
    for (const entry of entries.values()) {
      URL.revokeObjectURL(entry.previewUrl)
    }
    entries.clear()
  }

  function normalizeMarkdown(markdown: string): string {
    let result = markdown
    for (const entry of entries.values()) {
      result = result.replaceAll(entry.previewUrl, `${FEEDBACK_ATTACH_PREFIX}${entry.id}`)
    }
    return result
  }

  return {
    register,
    get,
    list,
    clear,
    normalizeMarkdown
  }
}

export type FeedbackAttachmentRegistry = ReturnType<typeof createFeedbackAttachmentRegistry>

export const FEEDBACK_ATTACHMENT_REGISTRY_KEY = Symbol('feedback-attachment-registry')
export const FEEDBACK_MEDIA_ERROR_KEY = Symbol('feedback-media-error')
