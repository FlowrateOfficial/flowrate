// NOTE - ANCHOR: Upload feedback media into the private feedback repo

import { formatGithubError } from './errors'
import { getDefaultBranch, githubHeaders, parseGitHubRepo } from './client'

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

function safeFilename(name: string): string {
  const base = name.trim().replace(/[^\w.\-]+/g, '-').replace(/-+/g, '-')
  return (base || 'attachment').slice(0, 120)
}

function rawGitHubUrl(owner: string, name: string, branch: string, path: string): string {
  return `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${path}`
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
  const branch = await getDefaultBranch(token, owner, name)
  const uploaded: FeedbackUploadedAsset[] = []
  const failures: FeedbackUploadFailure[] = []

  for (const file of files) {
    const filename = safeFilename(file.filename)
    const path = `feedback/issues/${issueNumber}/${file.id}-${filename}`

    try {
      await $fetch(
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
        markdownUrl: rawGitHubUrl(owner, name, branch, path)
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
