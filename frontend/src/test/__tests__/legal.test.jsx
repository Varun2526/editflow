import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from '../helpers'

vi.mock('../../api/inquiries', () => ({ inquiriesApi: { submit: vi.fn() } }))

describe('legal pages and footer', () => {
  it('serves the Terms of Service with its sections', async () => {
    renderApp('/terms')
    expect(await screen.findByRole('heading', { level: 1, name: 'Terms of Service' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '5. Review, revisions and approval' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '6. Fees and payments' })).toBeInTheDocument()
  })

  it('serves the Privacy Policy, stating there is no tracking', async () => {
    renderApp('/privacy')
    expect(await screen.findByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument()
    expect(screen.getByText(/There are no analytics, advertising or tracking cookies/)).toBeInTheDocument()
  })

  it('links both pages from the public footer and keeps the maker’s mark hidden until selected', async () => {
    renderApp('/')
    const footer = await screen.findByRole('navigation', { name: 'Footer' })
    expect(within(footer).getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
    expect(within(footer).getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')

    const credit = screen.getByText('Built by Varun Koppula')
    expect(credit).toHaveClass('text-transparent')
    expect(credit.className).toContain('selection:text-white')
  })

  it('the inquiry form links the terms it asks people to accept', async () => {
    renderApp('/work-with-me')
    await screen.findByRole('button', { name: 'Submit inquiry' })
    const consent = screen.getByText(/By submitting, you agree to the/)
    expect(within(consent).getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
    expect(within(consent).getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
  })
})
