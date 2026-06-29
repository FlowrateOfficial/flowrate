// NOTE - ANCHOR: Fetch GitHub issue threads for in-app feedback replies

import { FEEDBACK_ANCHORS, repairFeedbackMarkdown } from '#shared/feedback'
import type { FeedbackLabel } from '#shared/feedback'
import { visibleIssueLabels } from './labels'
import { githubHeaders, parseGitHubRepo } from './client'

export interface FeedbackThreadReply {
  id: number
  authorName: string
  authorAvatar: string | null
  body: string
  createdAt: string
}

export interface FeedbackIssueMeta {
  state: 'open' | 'closed'
  commentCount: number
  labels: FeedbackLabel[]
}

export interface FeedbackThread {
  issueNumber: number
  title: string
  state: 'open' | 'closed'
  type: string
  submittedAt: string
  updatedAt: string
  description: string
  labels: FeedbackLabel[]
  replies: FeedbackThreadReply[]
}

interface GitHubIssueLabel {
  name: string
  color: string
  description?: string | null
}

interface GitHubIssue {
  number: number
  title: string
  state: 'open' | 'closed'
  body: string | null
  created_at: string
  updated_at: string
  comments: number
  labels: GitHubIssueLabel[]
}

interface GitHubComment {
  id: number
  body: string
  created_at: string
  user: { login: string, avatar_url: string | null } | null
}

function isAutomatedComment(body: string): boolean {
  return body.includes(FEEDBACK_ANCHORS.context)
    || body.includes(FEEDBACK_ANCHORS.attachments)
}

function parseIssueDescription(body: string | null): string {
  if (!body) return ''

  const text = body
    .replace(FEEDBACK_ANCHORS.description, '')
    .replace('**Submitted from FlowRate app**', '')
    .replace('_Loading description and attachments…_', '')
    .replace(/_Do not paste bank credentials or full account numbers in public feedback\._/g, '')
    .trim()

  return repairFeedbackMarkdown(text)
}

function cleanReplyBody(body: string): string {
  return body
    .replace(FEEDBACK_ANCHORS.reply, '')
    .trim()
}

export async function fetchIssueMeta(
  token: string,
  repo: string,
  issueNumber: number
): Promise<FeedbackIssueMeta> {
  const { owner, name } = parseGitHubRepo(repo)
  const issue = await $fetch<GitHubIssue>(
    `https://api.github.com/repos/${owner}/${name}/issues/${issueNumber}`,
    { headers: githubHeaders(token) }
  )

  return {
    state: issue.state,
    commentCount: issue.comments,
    labels: visibleIssueLabels(issue.labels ?? [])
  }
}

export async function fetchIssueThread(
  token: string,
  repo: string,
  issueNumber: number,
  type: string
): Promise<FeedbackThread> {
  const { owner, name } = parseGitHubRepo(repo)

  const [issue, comments] = await Promise.all([
    $fetch<GitHubIssue>(
      `https://api.github.com/repos/${owner}/${name}/issues/${issueNumber}`,
      { headers: githubHeaders(token) }
    ),
    $fetch<GitHubComment[]>(
      `https://api.github.com/repos/${owner}/${name}/issues/${issueNumber}/comments`,
      { headers: githubHeaders(token) }
    )
  ])

  const replies = comments
    .filter(comment => !isAutomatedComment(comment.body))
    .map(comment => ({
      id: comment.id,
      authorName: comment.user?.login ?? 'FlowRate team',
      authorAvatar: comment.user?.avatar_url ?? null,
      body: cleanReplyBody(comment.body),
      createdAt: comment.created_at
    }))

  return {
    issueNumber: issue.number,
    title: issue.title,
    state: issue.state,
    type,
    submittedAt: issue.created_at,
    updatedAt: issue.updated_at,
    description: parseIssueDescription(issue.body),
    labels: visibleIssueLabels(issue.labels ?? []),
    replies
  }
}
