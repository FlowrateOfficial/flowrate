// ANCHOR: Dashboard page title — i18n key + app name
export function useDashboardSeo(titleKey: string) {
  const { t } = useAppI18n()
  useSeoMeta({ title: () => `${t(titleKey)} — ${t('common.appName')}` })
}
