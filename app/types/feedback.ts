export interface FeedbackLabel {
  name: string
  color: string
  description?: string | null
}

export interface FeedbackSubmissionSummary {
  issueNumber: number
  type: string
  title: string
  submittedAt: string
  state: 'open' | 'closed'
  replyCount: number
  labels: FeedbackLabel[]
}

export interface FeedbackThreadReply {
  id: number
  authorName: string
  authorAvatar: string | null
  body: string
  createdAt: string
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
