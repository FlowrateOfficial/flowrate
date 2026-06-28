#!/usr/bin/env node
/**
 * Keep per-page locale files empty so nuxt-i18n-micro does not shallow-merge
 * stale partial trees over locales/en.json and locales/fr.json.
 * Clears the Nitro i18n merge cache so the next dev/build picks up root locale changes.
 */
import { readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const pagesDir = join(root, 'locales/pages')
const mergeCache = join(root, '.nuxt/i18n-merged')

function clearPageLocales() {
  if (!existsSync(pagesDir)) return 0
  let count = 0
  for (const page of readdirSync(pagesDir)) {
    const pagePath = join(pagesDir, page)
    for (const file of ['en.json', 'fr.json']) {
      const path = join(pagePath, file)
      if (!existsSync(path)) continue
      const raw = readFileSync(path, 'utf8').trim()
      if (raw !== '{}') {
        writeFileSync(path, '{}\n')
        count++
      }
    }
  }
  return count
}

const cleared = clearPageLocales()

if (existsSync(mergeCache)) {
  rmSync(mergeCache, { recursive: true, force: true })
  console.log('Cleared .nuxt/i18n-merged — restart `pnpm dev` to reload translations.')
}

console.log(cleared
  ? `Reset ${cleared} page locale file(s) to {}.`
  : 'Page locale files already empty.')
