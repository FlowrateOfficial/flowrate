// ANCHOR: GitHub issue snapshot fetch + DB cache sync for feedback list

import type { FeedbackUserLabel } from '#shared/feedback'
import {
  FEEDBACK_SYNC_CONCURRENCY,
  FEEDBACK_SYNC_TTL_MS
} from '#shared/feedback'
import { mapConcurrent } from '../concurrency'
import { githubHeaders, parseGitHubRepo } from './client'
import { isAutomatedFeedbackComment } from './thread'

export interface IssueSnapshot {
  state: 'open' | 'closed'
  replyCount: number
  labels: FeedbackUserLabel[]
}

interface GitHubIssueResponse {
  state: 'open' | 'closed'
  comments: number
  labels: Array<{ name: string }>
}

interface GitHubCommentResponse {
  body: string
}

function parseUserLabels(labels: Array<{ name: string }>): FeedbackUserLabel[] {
  return labels
    .map(label => label.name)
    .filter((name): name is FeedbackUserLabel => name === 'USER_BUG' || name === 'USER_FEATURE')
}

export async function fetchIssueSnapshot(
  token: string,
  repo: string,
  issueNumber: number
): Promise<IssueSnapshot> {
  const { owner, name } = parseGitHubRepo(repo)
  const headers = githubHeaders(token)
  const issueUrl = `https://api.github.com/repos/${owner}/${name}/issues/${issueNumber}`

  const issue = await $fetch<GitHubIssueResponse>(issueUrl, { headers })

  let replyCount = 0
  if (issue.comments > 0) {
    const comments = await $fetch<GitHubCommentResponse[]>(
      `${issueUrl}/comments`,
      { headers, query: { per_page: 100 } }
    )
    replyCount = comments.filter(comment => !isAutomatedFeedbackComment(comment.body)).length
  }

  return {
    state: issue.state,
    replyCount,
    labels: parseUserLabels(issue.labels)
  }
}

export function isFeedbackSyncStale(syncedAt: Date | null | undefined, now = Date.now()): boolean {
  if (!syncedAt) return true
  return now - syncedAt.getTime() > FEEDBACK_SYNC_TTL_MS
}

interface SubmissionRow {
  id: string
  issueNumber: number
  syncedAt: Date | null
}

export async function syncSubmissionCache(
  token: string,
  repo: string,
  row: SubmissionRow
): Promise<void> {
  const snapshot = await fetchIssueSnapshot(token, repo, row.issueNumber)

  await prisma.feedbackSubmission.update({
    where: { id: row.id },
    data: {
      issueState: snapshot.state,
      replyCount: snapshot.replyCount,
      labelsJson: JSON.stringify(snapshot.labels),
      syncedAt: new Date()
    }
  })
}

export async function syncStaleSubmissions(
  token: string,
  repo: string,
  rows: SubmissionRow[],
  { force = false }: { force?: boolean } = {}
): Promise<void> {
  const now = Date.now()
  const stale = force
    ? rows
    : rows.filter(row => isFeedbackSyncStale(row.syncedAt, now))

  if (!stale.length) return

  await mapConcurrent(stale, FEEDBACK_SYNC_CONCURRENCY, row =>
    syncSubmissionCache(token, repo, row).catch((error) => {
      console.warn(`[feedback] sync failed for #${row.issueNumber}:`, error)
    })
  )
}

export async function applyIssueSnapshot(
  submissionId: string,
  snapshot: IssueSnapshot
): Promise<void> {
  await prisma.feedbackSubmission.update({
    where: { id: submissionId },
    data: {
      issueState: snapshot.state,
      replyCount: snapshot.replyCount,
      labelsJson: JSON.stringify(snapshot.labels),
      syncedAt: new Date()
    }
  })
}

export function labelsFromJson(labelsJson: string): FeedbackUserLabel[] {
  try {
    const parsed = JSON.parse(labelsJson)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (name): name is FeedbackUserLabel => name === 'USER_BUG' || name === 'USER_FEATURE'
    )
  } catch {
    return []
  }
}
