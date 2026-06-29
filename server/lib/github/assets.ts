// NOTE - ANCHOR: Upload feedback media into the private feedback repo

import { formatGithubError } from './errors'
import {
  ensureFeedbackMediaBranch,
  githubHeaders,
  issueAssetUrl,
  parseGitHubRepo
} from './client'

export interface FeedbackUploadedAsset {
  id: string
  filename: string
  mimeType: string
  path: string
  markdownUrl: string
}

export interface FeedbackUploadFailure {
  id: string
  filename: string
  error: string
}

interface ContentsUploadResponse {
  commit: { sha: string }
}

function safeFilename(name: string): string {
  const base = name.trim().replace(/[^\w.-]+/g, '-').replace(/-+/g, '-')
  return (base || 'attachment').slice(0, 120)
}

function feedbackMediaPath(issueNumber: number, id: string, filename: string): string {
  return `issues/${issueNumber}/${id}-${filename}`
}

export async function uploadFeedbackAssets(
  token: string,
  repo: string,
  issueNumber: number,
  files: Array<{ id: string, filename: string, mimeType: string, data: Buffer }>
): Promise<{ uploaded: FeedbackUploadedAsset[], failures: FeedbackUploadFailure[] }> {
  if (!files.length) {
    return { uploaded: [], failures: [] }
  }

  const { owner, name } = parseGitHubRepo(repo)
  const branch = await ensureFeedbackMediaBranch(token, owner, name)
  const uploaded: FeedbackUploadedAsset[] = []
  const failures: FeedbackUploadFailure[] = []

  for (const file of files) {
    const filename = safeFilename(file.filename)
    const path = feedbackMediaPath(issueNumber, file.id, filename)

    try {
      const response = await $fetch<ContentsUploadResponse>(
        `https://api.github.com/repos/${owner}/${name}/contents/${path}`,
        {
          method: 'PUT',
          headers: githubHeaders(token),
          body: {
            message: `feedback: issue #${issueNumber} attachment ${filename}`,
            content: file.data.toString('base64'),
            branch
          }
        }
      )

      uploaded.push({
        id: file.id,
        filename,
        mimeType: file.mimeType,
        path,
        markdownUrl: issueAssetUrl(owner, name, response.commit.sha, path)
      })
    } catch (error) {
      failures.push({
        id: file.id,
        filename,
        error: formatGithubError(error)
      })
    }
  }

  return { uploaded, failures }
}
