/**
 * Tracks requests that are taking a while — on Render's free tier the backend sleeps when idle and
 * the first request after that can take ~50s. The UI shows a "waking up" notice instead of
 * looking broken.
 */
const SLOW_AFTER_MS = 3500
let slowCount = 0
const listeners = new Set()

function emit() {
  for (const listener of listeners) listener(slowCount > 0)
}

/** Call when a request starts; call the returned function when it settles. */
export function trackRequest() {
  let slow = false
  const timer = setTimeout(() => {
    slow = true
    slowCount += 1
    emit()
  }, SLOW_AFTER_MS)
  return () => {
    clearTimeout(timer)
    if (slow) {
      slowCount -= 1
      emit()
    }
  }
}

export function subscribeServerSlow(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

let warmed = false

/**
 * Fire-and-forget ping so a sleeping backend starts booting while the visitor is still reading the
 * page. `no-cors` because only the side effect matters (the response is never read).
 */
export function warmUpServer(baseURL = import.meta.env.VITE_API_URL) {
  if (warmed || import.meta.env.MODE === 'test' || typeof fetch !== 'function') return
  warmed = true
  fetch(`${baseURL ?? ''}/actuator/health`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {})
}
