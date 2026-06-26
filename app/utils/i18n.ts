import type { SpaceType } from '~/types/space'

const ZOD_LOCALES = {
  en: () => import('zod/v4/locales/en.js').then(m => m.default()),
  fr: () => import('zod/v4/locales/fr.js').then(m => m.default())
} as const

export type AppLocale = keyof typeof ZOD_LOCALES

export async function applyZodLocale(locale: string) {
  const { z } = await import('zod')
  const loader = ZOD_LOCALES[locale as AppLocale] ?? ZOD_LOCALES.en
  z.config(await loader())
}

export function spaceTypeKey(type: SpaceType): string {
  return `spaceTypes.${type}`
}
