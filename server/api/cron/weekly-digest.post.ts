import { sendWeeklyDigests } from '../../lib/services/weekly-digest.service'

export default defineEventHandler(async (event) => {
  const secret = getHeader(event, 'x-cron-secret')
  const config = useRuntimeConfig(event)
  if (!config.cronSecret || secret !== config.cronSecret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const appUrl = config.public.appUrl as string
  return sendWeeklyDigests(appUrl)
})
