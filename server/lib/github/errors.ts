// NOTE - ANCHOR: Parse GitHub API errors for logging and dev responses

export function formatGithubError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return error instanceof Error ? error.message : 'GitHub API error'
  }

  const fetchError = error as {
    data?: { message?: string, errors?: Array<{ message?: string }> }
    statusCode?: number
    statusMessage?: string
    message?: string
  }

  const parts: string[] = []
  if (fetchError.statusCode) {
    parts.push(`${fetchError.statusCode}`)
  }
  if (fetchError.data?.message) {
    parts.push(fetchError.data.message)
  }
  if (fetchError.data?.errors?.length) {
    parts.push(fetchError.data.errors.map(e => e.message).filter(Boolean).join('; '))
  }
  if (!parts.length && fetchError.message) {
    parts.push(fetchError.message)
  }

  return parts.join(': ') || 'GitHub API error'
}
