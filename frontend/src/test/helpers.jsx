import { render } from '@testing-library/react'
import { AxiosError } from 'axios'
import { MemoryRouter } from 'react-router'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'
import { AppRoutes } from '../routes/AppRoutes'

export const ADMIN = { id: 1, name: 'Editor', email: 'admin@editflow.test', role: 'ADMIN', mustChangePassword: false }
export const CLIENT = { id: 2, name: 'Rahul Fitness', email: 'rahul@fitness.test', role: 'CLIENT', mustChangePassword: false }

export function storeSession(user) {
  sessionStorage.setItem('editflow.session', JSON.stringify({
    token: 'test-token', expiresAt: new Date(Date.now() + 3600_000).toISOString(), user,
  }))
}

export function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

export function renderWithProviders(ui, path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

/** An error shaped exactly like a real Axios response error from the backend. */
export function apiFailure(status, data) {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', {}, null, { status, data, headers: {}, config: {}, statusText: '' })
}
