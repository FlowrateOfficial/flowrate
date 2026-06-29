// NOTE - ANCHOR: Create GitHub feedback issues with anchored follow-up comments

import { FEEDBACK_ANCHORS, FEEDBACK_ATTACH_PREFIX, feedbackLabelsForType, type FeedbackType } from '#shared/feedback'
import type { FeedbackUploadFailure } from './assets'
import { uploadFeedbackAssets } from './assets'
import { githubHeaders, parseGitHubRepo } from './client'

export type { FeedbackType }

export interface FeedbackAttachmentInput {
  id: string
  filename: string
  mimeType: string
  data: Buffer
}

export interface CreateFeedbackIssueInput {
  type: FeedbackType
  title: string
  message: string
  rating?: number
  attachments?: FeedbackAttachmentInput[]
  context?: {
    userId: string
    email: string
    name: string | null
    plan: string
    spaceName: string | null
    spaceType: string | null
    spaceRole: string | null
    locale: string | null
    path: string | null
    userAgent: string | null
  }
}

const TYPE_LABELS: Record<FeedbackType, string> = {
  review: 'Review',
  feature: 'Feature request',
  bug: 'Bug report'
}

function issueTitle(input: CreateFeedbackIssueInput): string {
  const prefix = TYPE_LABELS[input.type]
  const clean = input.title.trim().replace(/\s+/g, ' ')
  return `[${prefix}] ${clean}`.slice(0, 240)
}

function contextBody(ctx: NonNullable<CreateFeedbackIssueInput['context']>): string {
  return [
    `${FEEDBACK_ANCHORS.context}`,
    '',
    '### Context (auto-attached)',
    `- **User ID:** \`${ctx.userId}\``,
    `- **Email:** ${ctx.email}`,
    `- **Name:** ${ctx.name ?? '—'}`,
    `- **Plan:** ${ctx.plan}`,
    `- **Space:** ${ctx.spaceName ?? '—'} (${ctx.spaceType ?? '—'}, role: ${ctx.spaceRole ?? '—'})`,
    `- **Locale:** ${ctx.locale ?? '—'}`,
    `- **Page:** ${ctx.path ?? '—'}`,
    `- **User agent:** ${ctx.userAgent ?? '—'}`
  ].join('\n')
}

function embedMarkdown(asset: { filename: string, mimeType: string, markdownUrl: string }): string {
  return asset.mimeType.startsWith('video/')
    ? `[${asset.filename}](${asset.markdownUrl})`
    : `![${asset.filename}](${asset.markdownUrl})`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function replaceAttachmentToken(
  message: string,
  token: string,
  asset: { filename: string, mimeType: string, markdownUrl: string }
): string {
  let resolved = message
  const { markdownUrl } = asset

  const imagePattern = new RegExp(
    `!\\[([^\\]]*)]\\(${escapeRegExp(token)}\\)(?:\\s+"[^"]*")?`,
    'g'
  )
  resolved = resolved.replace(imagePattern, `![$1](${markdownUrl})`)

  const linkPattern = new RegExp(
    `(?<!!)\\[([^\\]]*)]\\(${escapeRegExp(token)}\\)`,
    'g'
  )
  resolved = resolved.replace(linkPattern, `[$1](${markdownUrl})`)

  if (resolved.includes(token)) {
    resolved = resolved.replaceAll(token, markdownUrl)
  }

  return resolved
}

function replaceAttachmentRefs(
  message: string,
  assets: Array<{ id: string, filename: string, mimeType: string, markdownUrl: string }>
): { message: string, attachmentLines: string[] } {
  let resolved = message
  const used = new Set<string>()
  const attachmentLines: string[] = []

  for (const asset of assets) {
    const token = `${FEEDBACK_ATTACH_PREFIX}${asset.id}`

    if (resolved.includes(token)) {
      resolved = replaceAttachmentToken(resolved, token, asset)
      used.add(asset.id)
    }
  }

  for (const asset of assets) {
    if (!used.has(asset.id)) {
      attachmentLines.push(embedMarkdown(asset))
    }
  }

  return { message: resolved.trim(), attachmentLines }
}

function descriptionBody(input: CreateFeedbackIssueInput, message: string): string {
  const lines = [
    FEEDBACK_ANCHORS.description,
    '',
    '**Submitted from FlowRate app**',
    ''
  ]

  if (input.type === 'review' && input.rating != null) {
    lines.push(`**Rating:** ${input.rating}/5`, '')
  }

  lines.push(message, '')
  lines.push('_Do not paste bank credentials or full account numbers in public feedback._')

  return lines.join('\n')
}

function attachmentsComment(
  lines: string[],
  failures: FeedbackUploadFailure[] = []
): string | null {
  const failureLines = failures.map(
    failure => `- **${failure.filename}** — upload failed (${failure.error}). Ensure \`GITHUB_TOKEN\` has **Contents: Read and write** on the repo.`
  )

  if (!lines.length && !failureLines.length) return null

  return [
    FEEDBACK_ANCHORS.attachments,
    '',
    '### Attachments',
    '',
    ...lines,
    ...(lines.length && failureLines.length ? [''] : []),
    ...failureLines
  ].join('\n')
}

async function createIssueComment(
  token: string,
  owner: string,
  name: string,
  issueNumber: number,
  body: string
): Promise<void> {
  await $fetch(`https://api.github.com/repos/${owner}/${name}/issues/${issueNumber}/comments`, {
    method: 'POST',
    headers: githubHeaders(token),
    body: { body }
  })
}

async function updateIssueBody(
  token: string,
  owner: string,
  name: string,
  issueNumber: number,
  body: string
): Promise<void> {
  await $fetch(`https://api.github.com/repos/${owner}/${name}/issues/${issueNumber}`, {
    method: 'PATCH',
    headers: githubHeaders(token),
    body: { body }
  })
}

export async function createFeedbackIssue(
  token: string,
  repo: string,
  input: CreateFeedbackIssueInput
): Promise<{ issueNumber: number }> {
  const { owner, name } = parseGitHubRepo(repo)

  const stubBody = [
    '**Submitted from FlowRate app**',
    '',
    '_Loading description and attachments…_'
  ].join('\n')

  const response = await $fetch<{ number: number }>(
    `https://api.github.com/repos/${owner}/${name}/issues`,
    {
      method: 'POST',
      headers: githubHeaders(token),
      body: {
        title: issueTitle(input),
        body: stubBody,
        labels: feedbackLabelsForType(input.type)
      }
    }
  )

  const issueNumber = response.number
  const { uploaded, failures } = await uploadFeedbackAssets(
    token,
    repo,
    issueNumber,
    input.attachments ?? []
  )

  const { message, attachmentLines } = replaceAttachmentRefs(input.message, uploaded)
  const body = descriptionBody(input, message)

  await updateIssueBody(token, owner, name, issueNumber, body)

  const extraAttachments = attachmentsComment(attachmentLines, failures)
  if (extraAttachments) {
    await createIssueComment(token, owner, name, issueNumber, extraAttachments)
  }

  if (input.context) {
    await createIssueComment(token, owner, name, issueNumber, contextBody(input.context))
  }

  return { issueNumber }
}

export function isGitHubFeedbackConfigured(config: {
  githubToken?: string
  githubFeedbackRepo?: string
}): boolean {
  return Boolean(config.githubToken?.trim() && config.githubFeedbackRepo?.trim())
}
