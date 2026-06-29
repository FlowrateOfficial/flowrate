// NOTE - ANCHOR: Shared GitHub REST helpers for feedback issues

import { FEEDBACK_MEDIA_BRANCH } from '#shared/feedback'

export function parseGitHubRepo(repo: string): { owner: string, name: string } {
  const [owner, name] = repo.split('/')
  if (!owner || !name) {
    throw createError({ statusCode: 500, message: 'Invalid GITHUB_FEEDBACK_REPO format' })
  }
  return { owner, name }
}

export function githubHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'FlowRate-Feedback'
  }
}

/** Public GitHub blob URL that renders in issues and in-app img tags */
export function issueAssetUrl(
  owner: string,
  name: string,
  commitSha: string,
  path: string
): string {
  return `https://github.com/${owner}/${name}/blob/${commitSha}/${path}?raw=true`
}

async function createOrphanMediaBranch(
  token: string,
  owner: string,
  name: string
): Promise<void> {
  const blob = await $fetch<{ sha: string }>(
    `https://api.github.com/repos/${owner}/${name}/git/blobs`,
    {
      method: 'POST',
      headers: githubHeaders(token),
      body: {
        content: Buffer.from(
          '# FlowRate feedback media\n\nThis orphan branch stores in-app feedback attachments only.\n',
          'utf8'
        ).toString('base64'),
        encoding: 'base64'
      }
    }
  )

  const tree = await $fetch<{ sha: string }>(
    `https://api.github.com/repos/${owner}/${name}/git/trees`,
    {
      method: 'POST',
      headers: githubHeaders(token),
      body: {
        tree: [{ path: 'README.md', mode: '100644', type: 'blob', sha: blob.sha }]
      }
    }
  )

  const commit = await $fetch<{ sha: string }>(
    `https://api.github.com/repos/${owner}/${name}/git/commits`,
    {
      method: 'POST',
      headers: githubHeaders(token),
      body: {
        message: 'Initialize feedback media branch',
        tree: tree.sha,
        parents: []
      }
    }
  )

  await $fetch(`https://api.github.com/repos/${owner}/${name}/git/refs`, {
    method: 'POST',
    headers: githubHeaders(token),
    body: {
      ref: `refs/heads/${FEEDBACK_MEDIA_BRANCH}`,
      sha: commit.sha
    }
  })
}

/** Standalone orphan branch — only feedback uploads, never merged into app code */
export async function ensureFeedbackMediaBranch(
  token: string,
  owner: string,
  name: string
): Promise<string> {
  try {
    await $fetch(
      `https://api.github.com/repos/${owner}/${name}/git/ref/heads/${FEEDBACK_MEDIA_BRANCH}`,
      { headers: githubHeaders(token) }
    )
    return FEEDBACK_MEDIA_BRANCH
  } catch {
    await createOrphanMediaBranch(token, owner, name)
    return FEEDBACK_MEDIA_BRANCH
  }
}
