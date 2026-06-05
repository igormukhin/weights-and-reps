import { describe, expect, it } from 'vitest'
import {
  CHUNK_LOAD_RECOVERY_KEY,
  isChunkLoadError,
  recoverFromChunkLoadError,
} from './chunkLoadRecovery'

function createBrowser(pathname = '/login') {
  const store = new Map<string, string>()
  const assignedUrls: string[] = []

  return {
    assignedUrls,
    browser: {
      location: {
        pathname,
        search: '',
        hash: '',
        assign(url: string) {
          assignedUrls.push(url)
        },
      },
      sessionStorage: {
        getItem(key: string) {
          return store.get(key) ?? null
        },
        setItem(key: string, value: string) {
          store.set(key, value)
        },
        removeItem(key: string) {
          store.delete(key)
        },
      },
    },
  }
}

describe('chunk load recovery', () => {
  it('detects dynamic import failures from stale route chunks', () => {
    expect(
      isChunkLoadError(
        new TypeError(
          'Failed to fetch dynamically imported module: /assets/LoginView-old.js',
        ),
      ),
    ).toBe(true)
    expect(isChunkLoadError(new Error('permission-denied'))).toBe(false)
  })

  it('reloads the failed route once', () => {
    const { browser, assignedUrls } = createBrowser()
    const error = new TypeError('Failed to fetch dynamically imported module')

    expect(recoverFromChunkLoadError(error, { fullPath: '/login' }, browser)).toBe(true)
    expect(assignedUrls).toEqual(['/login'])

    expect(recoverFromChunkLoadError(error, { fullPath: '/login' }, browser)).toBe(false)
    expect(assignedUrls).toEqual(['/login'])
  })

  it('clears the recovery marker after a successful navigation', () => {
    const { browser } = createBrowser()
    browser.sessionStorage.setItem(CHUNK_LOAD_RECOVERY_KEY, '/login')

    recoverFromChunkLoadError.clear(browser)

    expect(browser.sessionStorage.getItem(CHUNK_LOAD_RECOVERY_KEY)).toBeNull()
  })
})
