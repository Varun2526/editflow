import { useCallback, useEffect, useState } from 'react'
import { toApiError } from '../api/errors'

/**
 * Loads data from the API. Keeps the previous data while reloading (no flashing after a
 * mutation) and exposes reload() so pages can re-fetch the backend's latest state.
 */
export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    setState((previous) => ({ ...previous, loading: true, error: null }))
    fetcher()
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch((error) => active && setState({ data: undefined, error: toApiError(error), loading: false }))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { ...state, reload }
}
