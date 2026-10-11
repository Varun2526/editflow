import axios from 'axios'
import { trackRequest } from './serverStatus'

const baseURL = import.meta.env.VITE_API_URL

// An empty value is valid: the app then calls the API on its own origin (same-origin preview).
if (baseURL === undefined && import.meta.env.MODE !== 'test') {
  console.error('VITE_API_URL is not set. Copy frontend/.env.example to frontend/.env.')
}

/** The single Axios instance. Every API module goes through it. */
export const api = axios.create({
  baseURL,
  // Long enough for a sleeping Render instance to boot (~50s); slow requests show a notice meanwhile.
  timeout: 75000,
  headers: { 'Content-Type': 'application/json' },
})

let tokenProvider = () => null
let unauthorizedHandler = () => {}

/** Wired by AuthProvider so this module stays free of React. */
export function configureAuth({ getToken, onUnauthorized }) {
  tokenProvider = getToken
  unauthorizedHandler = onUnauthorized
}

api.interceptors.request.use((config) => {
  config.settle = trackRequest()
  const token = tokenProvider()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Endpoints where 401 means "wrong credentials", not "session expired".
const CREDENTIAL_ENDPOINTS = ['/api/auth/login']

api.interceptors.response.use(
  (response) => {
    response.config.settle?.()
    return response
  },
  (error) => {
    error.config?.settle?.()
    const status = error.response?.status
    const url = error.config?.url ?? ''
    if (status === 401 && !CREDENTIAL_ENDPOINTS.some((path) => url.endsWith(path))) {
      unauthorizedHandler()
    }
    return Promise.reject(error)
  },
)
