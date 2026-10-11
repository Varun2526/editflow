import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFailure, renderWithProviders } from '../helpers'
import { VideoStatusControl } from '../../components/domain/VideoStatusControl'

vi.mock('../../api/auth', () => ({ authApi: { me: vi.fn() } }))
vi.mock('../../api/videos', () => ({ videosApi: { changeStatus: vi.fn() } }))
const { videosApi } = await import('../../api/videos')

const video = (status, allowedTransitions) => ({ id: 9, title: 'Morning Workout Reel', status, allowedTransitions })

describe('VideoStatusControl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('offers only the transitions the backend allows', () => {
    renderWithProviders(<VideoStatusControl video={video('PENDING', ['MEDIA_RECEIVED'])} />)

    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Media received' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deliver' })).not.toBeInTheDocument()
  })

  it('shows the forward step and the allowed correction', () => {
    renderWithProviders(<VideoStatusControl video={video('REVIEW', ['COMPLETED', 'EDITING'])} />)

    expect(screen.getByRole('button', { name: 'Mark completed' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Request changes' })).toBeInTheDocument()
  })

  it('calls the API and asks the page to refresh after a successful move', async () => {
    videosApi.changeStatus.mockResolvedValue({})
    const onChanged = vi.fn()
    renderWithProviders(<VideoStatusControl video={video('EDITING', ['REVIEW', 'MEDIA_RECEIVED'])} onChanged={onChanged} />)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Send to review' }))

    expect(videosApi.changeStatus).toHaveBeenCalledWith(9, 'REVIEW')
    await waitFor(() => expect(onChanged).toHaveBeenCalled())
  })

  it('shows the backend 409 message and re-syncs instead of changing anything locally', async () => {
    videosApi.changeStatus.mockRejectedValue(apiFailure(409, {
      message: 'Cannot change status from EDITING to REVIEW. Allowed: MEDIA_RECEIVED',
    }))
    const onChanged = vi.fn()
    renderWithProviders(<VideoStatusControl video={video('EDITING', ['REVIEW'])} onChanged={onChanged} />)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Send to review' }))

    const messages = await screen.findAllByText('Cannot change status from EDITING to REVIEW. Allowed: MEDIA_RECEIVED')
    expect(messages.length).toBeGreaterThan(0)
    expect(onChanged).toHaveBeenCalled()
  })

  it('asks for confirmation before a backward correction', async () => {
    videosApi.changeStatus.mockResolvedValue({})
    const user = userEvent.setup()
    renderWithProviders(<VideoStatusControl video={video('DELIVERED', ['EDITING'])} />)

    await user.click(screen.getByRole('button', { name: 'Reopen for editing' }))
    expect(videosApi.changeStatus).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Move back' }))

    expect(videosApi.changeStatus).toHaveBeenCalledWith(9, 'EDITING')
  })
})
