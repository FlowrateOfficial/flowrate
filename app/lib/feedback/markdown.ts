// NOTE - ANCHOR: Repair and render feedback markdown for thread display

import { githubFeedbackAssetUrl, githubFeedbackMediaProxyPath, repairFeedbackMarkdown } from '#shared/feedback'

export { repairFeedbackMarkdown }

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function isSafeMediaUrl(url: string): boolean {
  return url.startsWith('/api/feedback/media?')
    || (() => {
      try {
        const parsed = new URL(url)
        return parsed.protocol === 'https:'
          && (parsed.hostname === 'github.com' || parsed.hostname === 'raw.githubusercontent.com')
      } catch {
        return false
      }
    })()
}

function mediaImgSrc(url: string): string | null {
  const canonical = githubFeedbackAssetUrl(url)
  return githubFeedbackMediaProxyPath(canonical) ?? githubFeedbackMediaProxyPath(url)
}

export function feedbackMarkdownToHtml(content: string): string {
  const source = repairFeedbackMarkdown(content)
  if (!source) return ''

  const placeholders: string[] = []
  function stash(html: string): string {
    const key = `\u0000FB${placeholders.length}\u0000`
    placeholders.push(html)
    return key
  }

  let text = escapeHtml(source)

  text = text.replace(
    /!\[([^\]]*)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_, alt, url) => {
      const decoded = url.replaceAll('&amp;', '&')
      const proxySrc = mediaImgSrc(decoded)
      if (!proxySrc || !isSafeMediaUrl(proxySrc)) {
        return stash(`<span class="text-muted">[${alt}]</span>`)
      }
      const safeSrc = proxySrc.replaceAll('"', '&quot;')
      return stash(
        `<img src="${safeSrc}" alt="${alt}" class="my-2 max-h-80 w-auto rounded-lg border border-default" loading="lazy" />`
      )
    }
  )

  text = text.replace(
    /\[([^\]]+)]\(([^)]+)\)/g,
    (_, label, url) => {
      const decoded = githubFeedbackAssetUrl(url.replaceAll('&amp;', '&'))
      if (!isSafeMediaUrl(decoded)) {
        return stash(`<span class="text-muted">${label}</span>`)
      }
      const safeHref = decoded.replaceAll('"', '&quot;')
      return stash(
        `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">${label}</a>`
      )
    }
  )

  text = text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-3 mb-1">$1</h2>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br>')

  text = `<p class="mb-2">${text}</p>`
  text = placeholders.reduce(
    (html, chunk, index) => html.replaceAll(`\u0000FB${index}\u0000`, chunk),
    text
  )

  return text
}

export function cleanFeedbackAttachmentMarkdown(markdown: string): string {
  return repairFeedbackMarkdown(markdown)
}
