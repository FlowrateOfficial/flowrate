import { isGitHubFeedbackConfigured } from '../lib/github/issues'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  return {
    enabled: isGitHubFeedbackConfigured(config)
  }
})
