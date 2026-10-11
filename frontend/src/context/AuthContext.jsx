import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { configureAuth } from '../api/client'
import { authApi } from '../api/auth'
import { clearLegacySharedSession, clearSession, loadSession, saveSession } from '../utils/session'

clearLegacySharedSession()

const AuthContext = createContext(null)

/**
 * Holds the session (JWT + user). The backend is the source of truth: on start-up the stored
 * token is re-validated with /api/auth/me, and any 401 from the API ends the session.
 */
export function AuthProvider({ children }) {
  const [initial] = useState(() => loadSession())
  const [session, setSessionState] = useState(initial)
  const [ready, setReady] = useState(!initial)
  const [sessionExpired, setSessionExpired] = useState(false)
  // Read by the Axios interceptor. Updated together with state so the very next request
  // (even one fired from a child effect in the same commit) carries the right token.
  const sessionRef = useRef(initial)

  const setSession = useCallback((next) => {
    sessionRef.current = next
    setSessionState(next)
  }, [])

  const endSession = useCallback((expired) => {
    clearSession()
    setSession(null)
    setSessionExpired(expired)
  }, [setSession])

  useEffect(() => {
    configureAuth({
      getToken: () => sessionRef.current?.token ?? null,
      onUnauthorized: () => {
        if (sessionRef.current) endSession(true)
      },
    })
  }, [endSession])

  useEffect(() => {
    if (ready) return
    authApi.me()
      .then((user) => {
        const refreshed = { ...sessionRef.current, user }
        saveSession(refreshed)
        setSession(refreshed)
      })
      .catch(() => endSession(false))
      .finally(() => setReady(true))
  }, [ready, endSession, setSession])

  const applyLoginResponse = useCallback((response) => {
    const next = { token: response.token, expiresAt: response.expiresAt, user: response.user }
    saveSession(next)
    setSession(next)
    setSessionExpired(false)
    return next.user
  }, [setSession])

  const login = useCallback(
    async (email, password) => applyLoginResponse(await authApi.login(email.trim(), password)),
    [applyLoginResponse],
  )

  const changePassword = useCallback(
    async (currentPassword, newPassword) =>
      applyLoginResponse(await authApi.changePassword(currentPassword, newPassword)),
    [applyLoginResponse],
  )

  const logout = useCallback(() => endSession(false), [endSession])

  const value = useMemo(
    () => ({ user: session?.user ?? null, ready, sessionExpired, login, logout, changePassword }),
    [session, ready, sessionExpired, login, logout, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
