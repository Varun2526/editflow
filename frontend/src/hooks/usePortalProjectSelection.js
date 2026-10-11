import { useSearchParams } from 'react-router'
import { portalApi } from '../api/portal'
import { useApi } from './useApi'

/**
 * The client's own projects plus which one is selected (?project= in the URL, else the backend's
 * "current project" from the dashboard). The id is only a UI choice: the backend checks ownership.
 */
export function usePortalProjectSelection() {
  const [params, setParams] = useSearchParams()
  const projects = useApi(() => Promise.all([portalApi.projects(), portalApi.dashboard()]), [])
  const [list, dashboard] = projects.data ?? [[], null]
  const requested = Number(params.get('project'))
  const selectedId = list.some((p) => p.id === requested) ? requested : dashboard?.currentProject?.id ?? list[0]?.id

  return {
    state: projects,
    projects: list,
    selectedId,
    select: (id) => setParams({ project: String(id) }, { replace: true }),
  }
}
