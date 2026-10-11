import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ADMIN, CLIENT, renderApp, storeSession } from '../helpers'

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

describe('protected routes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends anonymous visitors of admin pages to login', async () => {
    renderApp('/admin/clients')
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('sends anonymous visitors of portal pages to login', async () => {
    renderApp('/portal/payments')
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('keeps clients out of the admin area', async () => {
    storeSession(CLIENT)
    authApi.me.mockResolvedValue(CLIENT)
    renderApp('/admin')

    expect(await screen.findByText('Client portal')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Today' })).not.toBeInTheDocument()
  })

  it('keeps admins out of the client portal', async () => {
    storeSession(ADMIN)
    authApi.me.mockResolvedValue(ADMIN)
    renderApp('/portal')

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument()
  })

  it('uses the role from the backend, not the stored session', async () => {
    // A tampered localStorage claiming ADMIN is corrected by /api/auth/me on start-up.
    storeSession({ ...CLIENT, role: 'ADMIN' })
    authApi.me.mockResolvedValue(CLIENT)
    renderApp('/admin')

    expect(await screen.findByText('Client portal')).toBeInTheDocument()
  })

  it('forces a pending password change before anything else', async () => {
    storeSession({ ...CLIENT, mustChangePassword: true })
    authApi.me.mockResolvedValue({ ...CLIENT, mustChangePassword: true })
    renderApp('/portal/videos')

    expect(await screen.findByRole('heading', { name: 'Set your password' })).toBeInTheDocument()
  })

  it('ends the session when the stored token is no longer valid', async () => {
    storeSession(ADMIN)
    authApi.me.mockRejectedValue(new Error('401'))
    renderApp('/admin')

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(sessionStorage.getItem('editflow.session')).toBeNull()
  })
})
