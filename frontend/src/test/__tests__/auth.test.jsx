import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ADMIN, CLIENT, apiFailure, renderApp } from '../helpers'

vi.mock('../../api/auth', () => ({ authApi: { login: vi.fn(), me: vi.fn(), changePassword: vi.fn() } }))
vi.mock('../../api/inquiries', () => ({ inquiriesApi: { list: vi.fn(() => new Promise(() => {})) } }))
vi.mock('../../api/videos', () => ({ videosApi: { listAll: vi.fn(() => new Promise(() => {})) } }))
vi.mock('../../api/projects', () => ({ projectsApi: { list: vi.fn(() => new Promise(() => {})) } }))
vi.mock('../../api/payments', () => ({ paymentsApi: { overview: vi.fn(() => new Promise(() => {})) } }))
vi.mock('../../api/dashboard', () => ({
  dashboardApi: { summary: vi.fn(() => new Promise(() => {})), tasks: vi.fn(() => new Promise(() => {})) },
}))
vi.mock('../../api/portal', () => ({
  portalApi: { dashboard: vi.fn(() => new Promise(() => {})), projectVideos: vi.fn() },
}))

const { authApi } = await import('../../api/auth')

function loginResponse(user) {
  return { token: 'jwt', tokenType: 'Bearer', expiresAt: new Date(Date.now() + 3600_000).toISOString(), user }
}

async function submitLogin(email = 'someone@editflow.test', password = 'secret-password') {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends admins to the admin dashboard', async () => {
    authApi.login.mockResolvedValue(loginResponse(ADMIN))
    renderApp('/login')

    await submitLogin('admin@editflow.test')

    expect(authApi.login).toHaveBeenCalledWith('admin@editflow.test', 'secret-password')
    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument()
    expect(JSON.parse(sessionStorage.getItem('editflow.session')).token).toBe('jwt')
  })

  it('sends clients to the client portal', async () => {
    authApi.login.mockResolvedValue(loginResponse(CLIENT))
    renderApp('/login')

    await submitLogin()

    expect(await screen.findByText('Client portal')).toBeInTheDocument()
  })

  it('sends accounts with a temporary password to the password screen', async () => {
    authApi.login.mockResolvedValue(loginResponse({ ...CLIENT, mustChangePassword: true }))
    renderApp('/login')

    await submitLogin()

    expect(await screen.findByRole('heading', { name: 'Set your password' })).toBeInTheDocument()
  })

  it('shows the backend message for invalid credentials and stays signed out', async () => {
    authApi.login.mockRejectedValue(apiFailure(401, { success: false, status: 401, message: 'Invalid email or password' }))
    renderApp('/login')

    await submitLogin()

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
    expect(sessionStorage.getItem('editflow.session')).toBeNull()
  })

  it('validates empty fields without calling the API', async () => {
    renderApp('/login')

    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign in' }))

    expect(screen.getByText('Enter your email')).toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
    await waitFor(() => expect(authApi.login).not.toHaveBeenCalled())
  })
})
