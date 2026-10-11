import { Film } from 'lucide-react'
import { portalApi } from '../../api/portal'
import { useApi } from '../../hooks/useApi'
import { usePortalProjectSelection } from '../../hooks/usePortalProjectSelection'
import { Card } from '../../components/ui/Card'
import { DataState, EmptyState } from '../../components/ui/States'
import { ClientVideoList } from '../../components/domain/ClientVideoList'
import { ProjectPicker } from '../../components/domain/ProjectPicker'

export default function Videos() {
  const selection = usePortalProjectSelection()
  const videos = useApi(
    () => (selection.selectedId ? portalApi.projectVideos(selection.selectedId) : Promise.resolve([])),
    [selection.selectedId],
  )

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">Videos</h1>
        <ProjectPicker projects={selection.projects} value={selection.selectedId} onChange={selection.select} />
      </div>
      <Card>
        <DataState state={selection.state}>
          {() => (
            <DataState
              state={videos}
              isEmpty={(list) => list.length === 0}
              empty={<EmptyState icon={Film} title="No videos yet" description="Videos for this project will appear here." />}
            >
              {(list) => <ClientVideoList videos={list} />}
            </DataState>
          )}
        </DataState>
      </Card>
    </>
  )
}
