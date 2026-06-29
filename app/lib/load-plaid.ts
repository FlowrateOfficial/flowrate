const PLAID_SCRIPT_SRC = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js'
const PLAID_READY_TIMEOUT_MS = 10_000

let loadPromise: Promise<void> | null = null

function waitForPlaidGlobal(): Promise<void> {
  if (window.Plaid) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const started = Date.now()

    const tick = () => {
      if (window.Plaid) {
        resolve()
        return
      }
      if (Date.now() - started > PLAID_READY_TIMEOUT_MS) {
        reject(new Error('Plaid Link failed to initialize'))
        return
      }
      requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  })
}

function injectPlaidScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PLAID_SCRIPT_SRC}"]`)

    if (existing) {
      if (window.Plaid) {
        resolve()
        return
      }
      existing.addEventListener('load', () => {
        waitForPlaidGlobal().then(resolve).catch(reject)
      }, { once: true })
      existing.addEventListener('error', () => {
        reject(new Error('Failed to load Plaid Link'))
      }, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = PLAID_SCRIPT_SRC
    script.async = true
    script.onload = () => {
      waitForPlaidGlobal().then(resolve).catch(reject)
    }
    script.onerror = () => reject(new Error('Failed to load Plaid Link'))
    document.head.appendChild(script)
  })
}

export function loadPlaidLink(): Promise<void> {
  if (import.meta.server) {
    return Promise.reject(new Error('Plaid Link is client-only'))
  }

  if (window.Plaid) return Promise.resolve()

  if (!loadPromise) {
    loadPromise = injectPlaidScript().catch((error) => {
      loadPromise = null
      throw error
    })
  }

  return loadPromise
}

export const PLAID_LINK_SCRIPT_URL = PLAID_SCRIPT_SRC
