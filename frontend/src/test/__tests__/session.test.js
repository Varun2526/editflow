import { describe, expect, it } from 'vitest'
import { clearSession, loadSession, saveSession } from '../../utils/session'

const session = (role) => ({ token: `${role}-token`, expiresAt: new Date(Date.now() + 3600_000).toISOString(), user: { role } })

describe('per-tab session storage', () => {
  it('keeps the session in sessionStorage, never in shared localStorage', () => {
    saveSession(session('ADMIN'))

    expect(JSON.parse(sessionStorage.getItem('editflow.session')).token).toBe('ADMIN-token')
    expect(localStorage.getItem('editflow.session')).toBeNull()
  })

  it("ignores another tab's shared localStorage session", () => {
    // What another tab would have written under the old shared design.
    localStorage.setItem('editflow.session', JSON.stringify(session('CLIENT')))
    saveSession(session('ADMIN'))

    expect(loadSession().user.role).toBe('ADMIN')
  })

  it('drops expired sessions', () => {
    saveSession({ ...session('ADMIN'), expiresAt: new Date(Date.now() - 1000).toISOString() })

    expect(loadSession()).toBeNull()
  })

  it('signing out only clears this tab', () => {
    saveSession(session('CLIENT'))
    clearSession()

    expect(loadSession()).toBeNull()
  })
})
