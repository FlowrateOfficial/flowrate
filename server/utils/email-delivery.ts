// TODO: Resend email delivery — planned
export function isResendEmailConfigured(
  config: { resendApiKey?: string, authFromEmail?: string } = useRuntimeConfig()
): boolean {
  return Boolean(config.resendApiKey?.trim() && config.authFromEmail?.trim())
}
