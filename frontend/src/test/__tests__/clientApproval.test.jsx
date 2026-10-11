import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CLIENT, apiFailure, renderApp, storeSession } from '../helpers'

vi.mock('../../api/auth', () => ({ authApi: { me: vi.fn() } }))
vi.mock('../../api/portal', () => ({ portalApi: { video: vi.fn(), approveVideo: vi.fn(), requestRevision: vi.fn() } }))

const { authApi } = await import('../../api/auth')
const { portalApi } = await import('../../api/portal')

const reviewVideo = {
  id: 5, projectId: 2, title: 'Morning Workout Reel', contentType: 'REEL', status: 'REVIEW', deadline: '2026-10-20',
  driveUrl: 'https://drive.google.com/file/d/x', overdue: false, revisionCount: 0, openRevisionCount: 0,
  approvedAt: null, deliveredAt: null,
}
const detail = (video, revisions = []) => ({ video, projectName: 'October 2026 Content', revisions })

describe('client video approval', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeSession(CLIENT)
    authApi.me.mockResolvedValue(CLIENT)
  })

  it('a video in review offers Watch, Approve and Request revision — and no editor controls', async () => {
    portalApi.video.mockResolvedValue(detail(reviewVideo))
    renderApp('/portal/videos/5')

    const review = await screen.findByRole('region', { name: 'Review this video' })
    expect(within(review).getByRole('heading', { name: 'Ready for your review' })).toBeInTheDocument()
    expect(within(review).getByRole('link', { name: /Watch video/ })).toHaveAttribute('href', reviewVideo.driveUrl)
    expect(within(review).getByRole('button', { name: 'Approve video' })).toBeInTheDocument()
    expect(within(review).getByRole('button', { name: 'Request revision' })).toBeInTheDocument()
    for (const adminAction of ['Mark completed', 'Mark approved', 'Deliver', 'Start revisions', 'Send to review', 'Resolve', 'Edit details']) {
      expect(screen.queryByRole('button', { name: adminAction })).not.toBeInTheDocument()
    }
  })

  it('approving calls the client endpoint and the page shows the approved state', async () => {
    const approved = { ...reviewVideo, status: 'COMPLETED', approvedAt: '2026-10-11T10:00:00Z' }
    portalApi.video.mockResolvedValueOnce(detail(reviewVideo)).mockResolvedValue(detail(approved))
    portalApi.approveVideo.mockResolvedValue(approved)
    renderApp('/portal/videos/5')

    await userEvent.click(await screen.findByRole('button', { name: 'Approve video' }))

    expect(portalApi.approveVideo).toHaveBeenCalledWith(5)
    expect(await screen.findByRole('heading', { name: 'Approved — ready for delivery' })).toBeInTheDocument()
    expect(screen.getByText('Video approved — your editor will deliver it')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve video' })).not.toBeInTheDocument()
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('shows the backend’s message when approval is refused', async () => {
    portalApi.video.mockResolvedValue(detail(reviewVideo))
    portalApi.approveVideo.mockRejectedValue(apiFailure(409, { message: 'Only a video that is ready for your review can be approved' }))
    renderApp('/portal/videos/5')

    await userEvent.click(await screen.findByRole('button', { name: 'Approve video' }))

    expect(await screen.findByText('Only a video that is ready for your review can be approved')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Approve video' })).toBeEnabled())
  })

  it('requesting a revision still works from a video in review', async () => {
    portalApi.video.mockResolvedValue(detail(reviewVideo))
    portalApi.requestRevision.mockResolvedValue({ id: 1, status: 'OPEN' })
    renderApp('/portal/videos/5')

    await userEvent.click(await screen.findByRole('button', { name: 'Request revision' }))
    expect(screen.getByLabelText('Timecode')).toHaveFocus()
    await userEvent.type(screen.getByLabelText('Timecode'), '00:17')
    await userEvent.type(screen.getByLabelText('Comment'), 'Make this transition faster.')
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }))

    await waitFor(() => expect(portalApi.requestRevision).toHaveBeenCalledWith(5, { timecode: '00:17', comment: 'Make this transition faster.' }))
    expect(portalApi.approveVideo).not.toHaveBeenCalled()
  })

  it('while the editor works on the client’s change requests there is nothing to approve', async () => {
    portalApi.video.mockResolvedValue(detail({ ...reviewVideo, status: 'EDITING', openRevisionCount: 1, revisionCount: 1 }))
    renderApp('/portal/videos/5')

    expect(await screen.findByRole('heading', { name: 'Your editor is working on 1 change request' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve video' })).not.toBeInTheDocument()
  })
})
