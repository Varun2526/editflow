/**
 * The session (JWT, its expiry and the minimal user identity) is stored per browser tab in
 * sessionStorage. Each tab therefore has its own independent login: an admin in one tab and a
 * client in another never overwrite each other, and signing out in one tab doesn't affect the
 * other. A reload keeps the tab signed in; a brand-new tab asks for a login.
 */
const KEY = 'editflow.session'

function storage() {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function loadSession() {
  try {
    const raw = storage()?.getItem(KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (!session?.token || !session?.expiresAt || new Date(session.expiresAt) <= new Date()) {
      storage()?.removeItem(KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function saveSession(session) {
  try {
    storage()?.setItem(KEY, JSON.stringify(session))
  } catch {
    // Storage unavailable: the session lives in memory for this tab only.
  }
}

export function clearSession() {
  try {
    storage()?.removeItem(KEY)
  } catch {
    // ignore
  }
}

/** Removes the shared, pre-per-tab session so an old login can't leak into new tabs. */
export function clearLegacySharedSession() {
  try {
    window.localStorage?.removeItem(KEY)
  } catch {
    // ignore
  }
}

export function homePathFor(user) {
  if (!user) return '/login'
  if (user.mustChangePassword) return '/change-password'
  return user.role === 'ADMIN' ? '/admin' : '/portal'
}
