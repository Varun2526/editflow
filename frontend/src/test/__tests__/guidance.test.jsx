import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ADMIN, CLIENT, renderApp, storeSession } from '../helpers'

vi.mock('../../api/auth', () => ({ authApi: { me: vi.fn() } }))
vi.mock('../../api/inquiries', () => ({ inquiriesApi: { list: vi.fn() } }))
vi.mock('../../api/videos', () => ({ videosApi: { listAll: vi.fn(), changeStatus: vi.fn() } }))
vi.mock('../../api/projects', () => ({ projectsApi: { list: vi.fn() } }))
vi.mock('../../api/payments', () => ({ paymentsApi: { overview: vi.fn() } }))
vi.mock('../../api/dashboard', () => ({ dashboardApi: { summary: vi.fn() } }))
vi.mock('../../api/portal', () => ({ portalApi: { dashboard: vi.fn(), projectVideos: vi.fn() } }))

const { authApi } = await import('../../api/auth')
const { inquiriesApi } = await import('../../api/inquiries')
const { videosApi } = await import('../../api/videos')
const { projectsApi } = await import('../../api/projects')
const { paymentsApi } = await import('../../api/payments')
const { dashboardApi } = await import('../../api/dashboard')
const { portalApi } = await import('../../api/portal')

const video = (id, title, status, extra = {}) => ({
  id, projectId: 1, title, contentType: 'REEL', status, deadline: null, driveUrl: null,
  overdue: false, revisionCount: 0, openRevisionCount: 0, allowedTransitions: [], ...extra,
})
const project = {
  id: 1, name: 'October 2026 Content', clientId: 2, clientName: 'Rahul Fitness', month: 10, year: 2026, status: 'ACTIVE',
  totalFee: '25000.00', description: null,
  videos: { total: 3, done: 1, progressPercent: 33.33, overdue: 0, byStatus: { DELIVERED: 1 } },
  payment: { totalFee: '25000.00', totalPaid: '10000.00', balance: '15000.00', status: 'PARTIALLY_PAID' },
}

const summary = {
  totalClients: 3, activeProjects: 2, pendingInquiries: 1, openRevisions: 0,
  videos: { total: 7, done: 3, progressPercent: 42.86, overdue: 1, byStatus: { PENDING: 1, EDITING: 2, REVIEW: 1, COMPLETED: 1, DELIVERED: 2 } },
  totalFees: '45000.00', totalPaid: '28000.00', outstanding: '17000.00',
}

describe('guided workflow screens', () => {
  beforeEach(() => vi.clearAllMocks())

  it('Today ranks what needs the admin and gives each item one clear action', async () => {
    storeSession(ADMIN)
    authApi.me.mockResolvedValue(ADMIN)
    inquiriesApi.list.mockResolvedValue([{ id: 9, name: 'Priya Talks', contentType: 'Podcasts', videosPerMonth: 4 }])
    videosApi.listAll.mockResolvedValue([
      { video: video(5, 'Morning Workout Reel', 'COMPLETED', { overdue: true }), projectName: project.name, clientName: 'Rahul Fitness' },
      { video: video(6, 'Nutrition Tips', 'PENDING'), projectName: project.name, clientName: 'Rahul Fitness' },
    ])
    projectsApi.list.mockResolvedValue([project])
    paymentsApi.overview.mockResolvedValue({ projects: [project], outstanding: '15000.00' })
    dashboardApi.summary.mockResolvedValue(summary)

    renderApp('/admin')

    expect(await screen.findByText('2 things need you · 1 waiting on clients.')).toBeInTheDocument()
    const needsYou = screen.getByText('Needs you').nextElementSibling
    const items = within(needsYou).getAllByRole('listitem')
    // Overdue delivery first, then the new inquiry.
    expect(within(items[0]).getByText('Morning Workout Reel')).toBeInTheDocument()
    expect(within(items[0]).getByRole('button', { name: 'Deliver' })).toBeInTheDocument()
    expect(within(items[1]).getByRole('link', { name: 'Review inquiry' })).toHaveAttribute('href', '/admin/inquiries?open=9')
    // The client-side wait is shown separately, with its catch-up action.
    expect(screen.getByText('Waiting on clients')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Media received' })).toBeInTheDocument()
  })

  it('Today shows the real key figures from the dashboard summary, below the queue', async () => {
    storeSession(ADMIN)
    authApi.me.mockResolvedValue(ADMIN)
    inquiriesApi.list.mockResolvedValue([])
    videosApi.listAll.mockResolvedValue([
      { video: video(5, 'Morning Workout Reel', 'COMPLETED', { approvedAt: '2026-10-11T10:00:00Z' }), projectName: project.name, clientName: 'Rahul Fitness' },
    ])
    projectsApi.list.mockResolvedValue([project])
    paymentsApi.overview.mockResolvedValue({ projects: [project], outstanding: '17000.00' })
    dashboardApi.summary.mockResolvedValue(summary)

    renderApp('/admin')

    const figures = (await screen.findByRole('heading', { name: 'Overview' })).closest('section')
    const value = (label) => within(figures).getByText(label).nextElementSibling.textContent
    expect(value('Active projects')).toBe('2')
    expect(value('Clients')).toBe('3')
    expect(value('Active videos')).toBe('5') // 7 in active projects − 2 delivered
    expect(value('Videos delivered')).toBe('2')
    expect(value('Project fees')).toBe('₹45,000')
    expect(value('Paid')).toBe('₹28,000')
    expect(value('Outstanding')).toBe('₹17,000')
    // The action queue stays first; the client-approved video's next step is delivery.
    const needsYou = screen.getByText('Needs you').closest('section')
    expect(needsYou.compareDocumentPosition(figures) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(needsYou).getByText(/Deliver this video/)).toBeInTheDocument()
    expect(within(needsYou).getByRole('button', { name: 'Deliver' })).toBeInTheDocument()
  })

  it('the client overview leads with what needs the client and links straight to it', async () => {
    storeSession(CLIENT)
    authApi.me.mockResolvedValue(CLIENT)
    portalApi.dashboard.mockResolvedValue({ clientName: 'Rahul Fitness', currentProject: project, upcomingDeadlines: [], openRevisions: 0 })
    portalApi.projectVideos.mockResolvedValue([
      video(5, 'Morning Workout Reel', 'REVIEW'),
      video(6, 'Nutrition Tips', 'PENDING'),
      video(7, 'Chest Workout', 'DELIVERED'),
    ])

    renderApp('/portal')

    expect(await screen.findByRole('heading', { name: '1 video ready for your review.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Review video' })).toHaveAttribute('href', '/portal/videos/5')
    expect(screen.getByText(/waiting for footage for 1 video/)).toBeInTheDocument()
    expect(screen.getByText('₹15,000')).toBeInTheDocument()
  })
})
