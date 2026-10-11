import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, configureAuth } from '../../api/client'
import { toApiError } from '../../api/errors'

function respondWith(status, data) {
  api.defaults.adapter = (config) => {
    const response = { status, data, headers: {}, config, statusText: '' }
    return status < 400
      ? Promise.resolve(response)
      : Promise.reject(Object.assign(new Error('fail'), { isAxiosError: true, response, config }))
  }
}

describe('api client', () => {
  afterEach(() => { delete api.defaults.adapter })

  it('attaches the bearer token to every request', async () => {
    configureAuth({ getToken: () => 'abc', onUnauthorized: vi.fn() })
    let sent
    api.defaults.adapter = (config) => { sent = config; return Promise.resolve({ status: 200, data: {}, headers: {}, config }) }

    await api.get('/api/admin/clients')

    expect(sent.headers.Authorization).toBe('Bearer abc')
  })

  it('ends the session on a 401 from a protected endpoint', async () => {
    const onUnauthorized = vi.fn()
    configureAuth({ getToken: () => 'expired', onUnauthorized })
    respondWith(401, { message: 'Invalid or expired token' })

    await expect(api.get('/api/admin/clients')).rejects.toBeTruthy()
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('does not treat wrong login credentials as an expired session', async () => {
    const onUnauthorized = vi.fn()
    configureAuth({ getToken: () => null, onUnauthorized })
    respondWith(401, { message: 'Invalid email or password' })

    await expect(api.post('/api/auth/login', {})).rejects.toBeTruthy()
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('normalises backend validation errors into field errors', async () => {
    respondWith(400, { message: 'Validation failed', errors: [{ field: 'email', message: 'must be a well-formed email address' }] })

    const error = toApiError(await api.post('/api/public/inquiries', {}).catch((e) => e))

    expect(error.status).toBe(400)
    expect(error.fieldErrors).toEqual({ email: 'must be a well-formed email address' })
  })

  it('gives a friendly message when the server is unreachable', () => {
    const error = toApiError(Object.assign(new Error('Network Error'), { isAxiosError: true }))
    expect(error.status).toBe(0)
    expect(error.message).toMatch(/can't reach the server/i)
  })
})
