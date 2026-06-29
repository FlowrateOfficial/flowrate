// NOTE - ANCHOR: List and persist user feedback submissions

import { FEEDBACK_ANCHORS } from '#shared/feedback'
import type { FeedbackLabel } from '#shared/feedback'
import { fetchIssueMeta } from './thread'
import { githubHeaders, parseGitHubRepo } from './client'

export interface FeedbackSubmissionSummary {
  issueNumber: number
  type: string
  title: string
  submittedAt: string
  state: 'open' | 'closed'
  replyCount: number
  labels: FeedbackLabel[]
}

export async function saveFeedbackSubmission(input: {
  userId: string
  issueNumber: number
  type: string
  title: string
}): Promise<void> {
  await prisma.feedbackSubmission.upsert({
    where: {
      userId_issueNumber: {
        userId: input.userId,
        issueNumber: input.issueNumber
      }
    },
    create: {
      userId: input.userId,
      issueNumber: input.issueNumber,
      type: input.type,
      title: input.title
    },
    update: {
      type: input.type,
      title: input.title
    }
  })
}

async function countTeamReplies(
  token: string,
  repo: string,
  issueNumber: number
): Promise<number> {
  const { owner, name } = parseGitHubRepo(repo)
  const comments = await $fetch<Array<{ body: string }>>(
    `https://api.github.com/repos/${owner}/${name}/issues/${issueNumber}/comments`,
    { headers: githubHeaders(token) }
  )

  return comments.filter(comment =>
    !comment.body.includes(FEEDBACK_ANCHORS.context)
    && !comment.body.includes(FEEDBACK_ANCHORS.attachments)
  ).length
}

export async function listFeedbackSubmissions(
  token: string,
  repo: string,
  userId: string
): Promise<FeedbackSubmissionSummary[]> {
  const rows = await prisma.feedbackSubmission.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  const items = await Promise.all(rows.map(async (row) => {
    try {
      const [meta, replyCount] = await Promise.all([
        fetchIssueMeta(token, repo, row.issueNumber),
        countTeamReplies(token, repo, row.issueNumber)
      ])

      return {
        issueNumber: row.issueNumber,
        type: row.type,
        title: row.title,
        submittedAt: row.createdAt.toISOString(),
        state: meta.state,
        replyCount,
        labels: meta.labels
      }
    } catch {
      return {
        issueNumber: row.issueNumber,
        type: row.type,
        title: row.title,
        submittedAt: row.createdAt.toISOString(),
        state: 'open' as const,
        replyCount: 0,
        labels: []
      }
    }
  }))

  return items
}

export async function getFeedbackSubmissionForUser(
  userId: string,
  issueNumber: number
) {
  return prisma.feedbackSubmission.findFirst({
    where: { userId, issueNumber }
  })
}
