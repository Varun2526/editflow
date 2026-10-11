import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CLIENT, apiFailure, renderApp, storeSession } from '../helpers'

vi.mock('../../api/auth', () => ({ authApi: { me: vi.fn() } }))
vi.mock('../../api/client', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, api: { get: vi.fn(), post: vi.fn() } }
})

const { api } = await import('../../api/client')
const { authApi } = await import('../../api/auth')
const { portalApi } = await import('../../api/portal')

const clientVideo = {
  id: 5, projectId: 2, title: 'Morning Workout Reel', contentType: 'REEL', status: 'REVIEW', deadline: '2026-10-20',
  driveUrl: 'https://drive.google.com/file/d/x', overdue: false, revisionCount: 0, openRevisionCount: 0, deliveredAt: null,
}

describe('client portal at the UI/API boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeSession(CLIENT)
    authApi.me.mockResolvedValue(CLIENT)
  })

  it('only ever calls /api/client/me endpoints and never sends a client id', async () => {
    api.get.mockResolvedValue({ data: {} })
    api.post.mockResolvedValue({ data: {} })

    await portalApi.dashboard()
    await portalApi.profile()
    await portalApi.projects()
    await portalApi.project(2)
    await portalApi.projectVideos(2)
    await portalApi.projectPayments(2)
    await portalApi.video(5)
    await portalApi.requestRevision(5, { timecode: '00:17', comment: 'Faster' })
    await portalApi.approveVideo(5)

    const urls = [...api.get.mock.calls, ...api.post.mock.calls].map(([url]) => url)
    expect(urls.every((url) => url.startsWith('/api/client/me/'))).toBe(true)
    expect(urls.some((url) => /client[_-]?id/i.test(url))).toBe(false)
  })

  it('shows a video without any admin workflow controls', async () => {
    api.get.mockResolvedValue({ data: { video: clientVideo, projectName: 'October 2026 Content', revisions: [] } })
    renderApp('/portal/videos/5')

    expect(await screen.findByRole('heading', { name: 'Morning Workout Reel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send request' })).toBeInTheDocument()
    for (const adminAction of ['Mark completed', 'Request changes', 'Deliver', 'Edit details', 'Resolve']) {
      expect(screen.queryByRole('button', { name: adminAction })).not.toBeInTheDocument()
    }
    expect(screen.queryByText(/internal notes/i)).not.toBeInTheDocument()
  })

  it("shows a clear no-access state when the backend refuses another client's video", async () => {
    api.get.mockRejectedValue(apiFailure(403, { message: 'You do not have access to this video' }))
    renderApp('/portal/videos/999')

    expect(await screen.findByText('No access')).toBeInTheDocument()
    expect(screen.getByText('You do not have access to this video')).toBeInTheDocument()
  })
})
