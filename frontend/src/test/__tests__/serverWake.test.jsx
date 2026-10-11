import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { trackRequest } from '../../api/serverStatus'
import { toApiError } from '../../api/errors'
import { ServerWakeNotice } from '../../components/ui/ServerWakeNotice'

describe('server wake-up notice', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('stays hidden for quick requests', () => {
    render(<ServerWakeNotice />)
    const settle = trackRequest()
    act(() => vi.advanceTimersByTime(1000))
    act(() => settle())
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('appears while a request is slow and disappears once it settles', () => {
    render(<ServerWakeNotice />)
    const settle = trackRequest()
    act(() => vi.advanceTimersByTime(3600))
    expect(screen.getByRole('status')).toHaveTextContent('Waking up the server')

    const second = trackRequest()
    act(() => vi.advanceTimersByTime(3600))
    act(() => settle())
    expect(screen.getByRole('status')).toBeInTheDocument() // one still pending

    act(() => second())
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('explains a timeout instead of blaming the connection', () => {
    const timeout = Object.assign(new Error('timeout'), { isAxiosError: true, code: 'ECONNABORTED' })
    expect(toApiError(timeout).message).toBe('The server is taking too long to respond. Please try again in a moment.')
  })
})
