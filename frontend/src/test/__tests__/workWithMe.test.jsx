import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFailure, renderApp } from '../helpers'

vi.mock('../../api/inquiries', () => ({ inquiriesApi: { submit: vi.fn() } }))
const { inquiriesApi } = await import('../../api/inquiries')

async function fillValidForm(user) {
  await user.type(await screen.findByLabelText('Name'), 'Rahul Fitness')
  await user.type(screen.getByLabelText('Email'), 'rahul@fitness.test')
  await user.type(screen.getByLabelText('Phone or Instagram'), '@rahulfitness')
  await user.click(screen.getByRole('button', { name: 'Reels' }))
  await user.click(screen.getByRole('button', { name: 'YouTube videos' }))
  await user.type(screen.getByLabelText('Videos per month'), '15')
  await user.type(screen.getByLabelText('Monthly budget (₹)'), '25000')
}

describe('Work With Me form', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows field errors and does not submit an empty form', async () => {
    const user = userEvent.setup()
    renderApp('/work-with-me')

    await user.click(await screen.findByRole('button', { name: 'Submit inquiry' }))

    expect(screen.getByText('Please enter your name')).toBeInTheDocument()
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Choose at least one type of content')).toBeInTheDocument()
    expect(screen.getByText('Enter how many videos per month (at least 1)')).toBeInTheDocument()
    expect(inquiriesApi.submit).not.toHaveBeenCalled()
  })

  it('submits exactly the backend DTO fields and shows the backend confirmation', async () => {
    inquiriesApi.submit.mockResolvedValue({ id: 7, message: 'Thanks! Your inquiry has been submitted.' })
    const user = userEvent.setup()
    renderApp('/work-with-me')

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit inquiry' }))

    expect(inquiriesApi.submit).toHaveBeenCalledWith({
      name: 'Rahul Fitness',
      email: 'rahul@fitness.test',
      phoneOrInstagram: '@rahulfitness',
      contentType: 'Reels, YouTube videos',
      videosPerMonth: 15,
      budget: 25000,
      deadline: null,
      description: null,
    })
    expect(await screen.findByRole('heading', { name: 'Thanks! Your inquiry has been submitted.' })).toBeInTheDocument()
  })

  it('shows server-side field errors next to the field', async () => {
    inquiriesApi.submit.mockRejectedValue(apiFailure(400, {
      message: 'Validation failed', errors: [{ field: 'email', message: 'must be a well-formed email address' }],
    }))
    const user = userEvent.setup()
    renderApp('/work-with-me')

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit inquiry' }))

    expect(await screen.findByText('must be a well-formed email address')).toBeInTheDocument()
  })

  it('explains a network failure', async () => {
    inquiriesApi.submit.mockRejectedValue(Object.assign(new Error('Network Error'), { isAxiosError: true }))
    const user = userEvent.setup()
    renderApp('/work-with-me')

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit inquiry' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/can't reach the server/i)
  })
})
