import axios from 'axios'

const FALLBACK = {
  400: 'Please check the highlighted fields.',
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have access to this.",
  404: 'This item could not be found.',
  409: 'This conflicts with the current state. Refresh and try again.',
  500: 'Something went wrong on the server. Please try again.',
}

/**
 * Normalises any failure into { status, message, fieldErrors }. The backend's ApiError message
 * is user-safe by design; network failures get a friendly message instead of a stack trace.
 */
export function toApiError(error) {
  if (error?.isApiError) return error
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return apiError(0, 'The server is taking too long to respond. Please try again in a moment.')
    }
    if (!error.response) {
      return apiError(0, "Can't reach the server. Check your connection and try again.")
    }
    const { status, data } = error.response
    const fieldErrors = {}
    for (const violation of data?.errors ?? []) {
      fieldErrors[violation.field] ??= violation.message
    }
    return apiError(status, data?.message || FALLBACK[status] || FALLBACK[500], fieldErrors)
  }
  return apiError(-1, 'Something went wrong. Please try again.')
}

function apiError(status, message, fieldErrors = {}) {
  return { isApiError: true, status, message, fieldErrors }
}
