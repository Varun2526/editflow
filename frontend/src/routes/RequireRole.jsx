import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { homePathFor } from '../utils/session'
import { FullPageSpinner } from '../components/ui/FullPageSpinner'

/**
 * Route guard. This is UX only: it keeps people out of screens they can't use. The backend
 * enforces every permission independently on each request.
 */
export function RequireRole({ role }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />
  if (role && user.role !== role) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}

export function RequireAuthenticated() {
  const { user, ready } = useAuth()
  if (!ready) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
