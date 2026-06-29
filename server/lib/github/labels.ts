// NOTE - ANCHOR: Parse GitHub issue labels for in-app feedback display

import {
  filterFeedbackDisplayLabels,
  type FeedbackLabel
} from '#shared/feedback'

interface GitHubLabelResponse {
  name: string
  color: string
  description?: string | null
}

export function parseGitHubLabels(labels: GitHubLabelResponse[]): FeedbackLabel[] {
  return labels.map(label => ({
    name: label.name,
    color: label.color,
    description: label.description ?? null
  }))
}

export function visibleIssueLabels(labels: GitHubLabelResponse[]): FeedbackLabel[] {
  return filterFeedbackDisplayLabels(parseGitHubLabels(labels))
}
