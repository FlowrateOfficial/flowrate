// NOTE - ANCHOR: Shared GitHub REST helpers for feedback issues

export function parseGitHubRepo(repo: string): { owner: string, name: string } {
  const [owner, name] = repo.split('/')
  if (!owner || !name) {
    throw createError({ statusCode: 500, message: 'Invalid GITHUB_FEEDBACK_REPO format' })
  }
  return { owner, name }
}

export function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'FlowRate-Feedback'
  }
}

export async function getDefaultBranch(token: string, owner: string, name: string): Promise<string> {
  const response = await $fetch<{ default_branch: string }>(
    `https://api.github.com/repos/${owner}/${name}`,
    { headers: githubHeaders(token) }
  )
  return response.default_branch
}
