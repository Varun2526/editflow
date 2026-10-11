import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Node 25 exposes an experimental global localStorage that shadows jsdom's and has no methods
// unless started with --localstorage-file. Tests get a plain in-memory Storage instead.
function memoryStorage() {
  const store = new Map()
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (index) => [...store.keys()][index] ?? null,
    get length() { return store.size },
  }
}
for (const name of ['localStorage', 'sessionStorage']) {
  if (typeof globalThis[name]?.setItem !== 'function') {
    const instance = memoryStorage()
    Object.defineProperty(globalThis, name, { value: instance, configurable: true })
    Object.defineProperty(window, name, { value: instance, configurable: true })
  }
}

// jsdom has no matchMedia (used by GSAP and the motion helpers): report "no preference".
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query) => ({
    matches: false, media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  })
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})
