export const CHUNK_LOAD_RECOVERY_KEY = 'weights-and-reps:chunk-load-recovery-url'

type ChunkLoadRecoveryBrowser = {
  location: Pick<Location, 'pathname' | 'search' | 'hash' | 'assign'>
  sessionStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
}

const CHUNK_LOAD_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
  /ChunkLoadError/i,
  /Loading chunk .* failed/i,
]

function getBrowser(): ChunkLoadRecoveryBrowser | null {
  return typeof window === 'undefined' ? null : window
}

function currentFullPath(browser: ChunkLoadRecoveryBrowser): string {
  const { pathname, search, hash } = browser.location
  return `${pathname}${search}${hash}`
}

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(message))
}

function clearChunkLoadRecoveryMarker(browser = getBrowser()): void {
  if (!browser) return

  try {
    browser.sessionStorage.removeItem(CHUNK_LOAD_RECOVERY_KEY)
  } catch {
    // Ignore storage failures; the marker is only an infinite-reload guard.
  }
}

function recover(
  error: unknown,
  to: { fullPath?: string } | undefined,
  browser = getBrowser(),
): boolean {
  if (!browser || !isChunkLoadError(error)) return false

  const targetPath = to?.fullPath ?? currentFullPath(browser)

  try {
    if (browser.sessionStorage.getItem(CHUNK_LOAD_RECOVERY_KEY) === targetPath) {
      return false
    }

    browser.sessionStorage.setItem(CHUNK_LOAD_RECOVERY_KEY, targetPath)
  } catch {
    return false
  }

  browser.location.assign(targetPath)
  return true
}

export const recoverFromChunkLoadError = Object.assign(recover, {
  clear: clearChunkLoadRecoveryMarker,
})
