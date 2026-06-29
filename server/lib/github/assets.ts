// ANCHOR: Upload feedback media into the private feedback repo

import { FEEDBACK_UPLOAD_CONCURRENCY } from '#shared/feedback'
import { mapConcurrent } from '../concurrency'
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

async function uploadSingleAsset(
  token: string,
  owner: string,
  name: string,
  branch: string,
  issueNumber: number,
  file: { id: string, filename: string, mimeType: string, data: Buffer }
): Promise<{ uploaded?: FeedbackUploadedAsset, failure?: FeedbackUploadFailure }> {
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

    return {
      uploaded: {
        id: file.id,
        filename,
        mimeType: file.mimeType,
        path,
        markdownUrl: issueAssetUrl(owner, name, response.commit.sha, path)
      }
    }
  } catch (error) {
    return {
      failure: {
        id: file.id,
        filename: file.filename,
        error: formatGithubError(error)
      }
    }
  }
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

  const results = await mapConcurrent(files, FEEDBACK_UPLOAD_CONCURRENCY, file =>
    uploadSingleAsset(token, owner, name, branch, issueNumber, file)
  )

  const uploaded: FeedbackUploadedAsset[] = []
  const failures: FeedbackUploadFailure[] = []

  for (const result of results) {
    if (result.uploaded) uploaded.push(result.uploaded)
    if (result.failure) failures.push(result.failure)
  }

  return { uploaded, failures }
}
