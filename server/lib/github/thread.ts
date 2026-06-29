// ANCHOR: Fetch GitHub issue thread for in-app feedback history

import type { FeedbackType } from '#shared/feedback'
import {
  FEEDBACK_ANCHORS,
  filterFeedbackDisplayLabels,
  repairFeedbackMarkdown
} from '#shared/feedback'
import { applyIssueSnapshot } from './sync'
import { githubHeaders, parseGitHubRepo } from './client'

export interface FeedbackThreadComment {
  id: number
  body: string
  createdAt: string
  authorName: string
  authorAvatar: string | null
  isTeam: boolean
}

export interface FeedbackThread {
  issueNumber: number
  title: string
  state: 'open' | 'closed'
  labels: Array<{ name: string, color: string, description?: string | null }>
  body: string
  createdAt: string
  replyCount: number
  comments: FeedbackThreadComment[]
}

interface GitHubIssueResponse {
  number: number
  title: string
  state: 'open' | 'closed'
  body: string | null
  created_at: string
  labels: Array<{ name: string, color: string, description?: string | null }>
}

interface GitHubCommentResponse {
  id: number
  body: string
  created_at: string
  user: { type: string, login?: string, avatar_url?: string | null } | null
}

export function isAutomatedFeedbackComment(body: string): boolean {
  const trimmed = body.trim()
  return trimmed.startsWith(FEEDBACK_ANCHORS.context)
    || trimmed.startsWith(FEEDBACK_ANCHORS.attachments)
    || trimmed.includes(FEEDBACK_ANCHORS.description)
}

export async function fetchIssueThread(
  token: string,
  repo: string,
  issueNumber: number,
  type: FeedbackType,
  options: { submissionId?: string } = {}
): Promise<FeedbackThread> {
  const { owner, name } = parseGitHubRepo(repo)
  const headers = githubHeaders(token)
  const issueUrl = `https://api.github.com/repos/${owner}/${name}/issues/${issueNumber}`

  const [issue, comments] = await Promise.all([
    $fetch<GitHubIssueResponse>(issueUrl, { headers }),
    $fetch<GitHubCommentResponse[]>(`${issueUrl}/comments`, {
      headers,
      query: { per_page: 100 }
    })
  ])

  const visibleComments = comments
    .filter(comment => !isAutomatedFeedbackComment(comment.body))
    .map((comment) => {
      const isTeam = comment.user?.type === 'User'
      return {
        id: comment.id,
        body: repairFeedbackMarkdown(comment.body),
        createdAt: comment.created_at,
        authorName: comment.user?.login ?? (isTeam ? 'FlowRate' : 'You'),
        authorAvatar: comment.user?.avatar_url ?? null,
        isTeam
      }
    })

  const displayLabels = filterFeedbackDisplayLabels(issue.labels)
  const replyCount = visibleComments.length

  if (options.submissionId) {
    const userLabels = issue.labels
      .map(label => label.name)
      .filter((name): name is 'USER_BUG' | 'USER_FEATURE' =>
        name === 'USER_BUG' || name === 'USER_FEATURE'
      )

    await applyIssueSnapshot(options.submissionId, {
      state: issue.state,
      replyCount,
      labels: userLabels
    }).catch(() => {})
  }

  return {
    issueNumber: issue.number,
    title: issue.title,
    state: issue.state,
    labels: displayLabels,
    body: repairFeedbackMarkdown(issue.body ?? ''),
    createdAt: issue.created_at,
    replyCount,
    comments: visibleComments
  }
}
