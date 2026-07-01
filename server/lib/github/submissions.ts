// ANCHOR: Feedback submission persistence + cached GitHub metadata

import type { FeedbackType, FeedbackUserLabel, FeedbackLabel } from '#shared/feedback'
import { feedbackDisplayLabelsFromJson } from '#shared/feedback'
import {
  isFeedbackSyncStale,
  syncStaleSubmissions
} from './sync'

export interface FeedbackSubmissionSummary {
  issueNumber: number
  type: FeedbackType
  title: string
  submittedAt: string
  state: 'open' | 'closed'
  replyCount: number
  labels: FeedbackLabel[]
}

export async function saveFeedbackSubmission(input: {
  userId: string
  issueNumber: number
  type: FeedbackType
  title: string
  labels?: FeedbackUserLabel[]
}): Promise<void> {
  await prisma.feedbackSubmission.create({
    data: {
      userId: input.userId,
      issueNumber: input.issueNumber,
      type: input.type,
      title: input.title,
      issueState: 'open',
      replyCount: 0,
      labelsJson: JSON.stringify(input.labels ?? []),
      syncedAt: new Date()
    }
  })
}

function rowToSummary(row: {
  issueNumber: number
  type: string
  title: string
  createdAt: Date
  issueState: string
  replyCount: number
  labelsJson: string
}): FeedbackSubmissionSummary {
  return {
    issueNumber: row.issueNumber,
    type: row.type as FeedbackType,
    title: row.title,
    submittedAt: row.createdAt.toISOString(),
    state: row.issueState === 'closed' ? 'closed' : 'open',
    replyCount: row.replyCount,
    labels: feedbackDisplayLabelsFromJson(row.labelsJson)
  }
}

export async function listFeedbackSubmissions(
  token: string,
  repo: string,
  userId: string,
  options: { refresh?: boolean } = {}
): Promise<FeedbackSubmissionSummary[]> {
  const rows = await prisma.feedbackSubmission.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      issueNumber: true,
      type: true,
      title: true,
      createdAt: true,
      issueState: true,
      replyCount: true,
      labelsJson: true,
      syncedAt: true
    }
  })

  if (!rows.length) return []

  const needsSync = options.refresh || rows.some(row => isFeedbackSyncStale(row.syncedAt))
  await syncStaleSubmissions(token, repo, rows, { force: options.refresh })

  if (needsSync) {
    const fresh = await prisma.feedbackSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        issueNumber: true,
        type: true,
        title: true,
        createdAt: true,
        issueState: true,
        replyCount: true,
        labelsJson: true
      }
    })
    return fresh.map(rowToSummary)
  }

  return rows.map(rowToSummary)
}

export async function getFeedbackSubmissionForUser(
  userId: string,
  issueNumber: number
) {
  return prisma.feedbackSubmission.findUnique({
    where: {
      userId_issueNumber: { userId, issueNumber }
    }
  })
}
