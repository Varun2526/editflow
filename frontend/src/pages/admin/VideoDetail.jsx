import { useRef, useState } from 'react'
import { Pencil } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { revisionsApi } from '../../api/revisions'
import { videosApi } from '../../api/videos'
import { toApiError } from '../../api/errors'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/format'
import { CONTENT_TYPE_LABEL, VIDEO_STATUS_LABEL } from '../../utils/labels'
import { videoNextStep } from '../../utils/workflow'
import { Card, CardHeader } from '../../components/ui/Card'
import { DriveLink } from '../../components/ui/DriveLink'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataState, PageSkeleton } from '../../components/ui/States'
import { OverdueBadge, VideoStatusBadge } from '../../components/ui/StatusBadges'
import { NextStepCard } from '../../components/domain/NextStepCard'
import { RevisionForm } from '../../components/domain/RevisionForm'
import { RevisionList } from '../../components/domain/RevisionList'
import { VideoFormModal } from '../../components/domain/VideoFormModal'
import { VideoStatusControl } from '../../components/domain/VideoStatusControl'
import { VideoTimeline } from '../../components/domain/VideoTimeline'

export default function VideoDetail() {
  const { id } = useParams()
  const toast = useToast()
  const detail = useApi(() => videosApi.get(id), [id])
  const [editing, setEditing] = useState(false)
  const [resolvingId, setResolvingId] = useState(null)
  const [stepBusy, setStepBusy] = useState(false)
  const revisionsRef = useRef(null)

  async function resolve(revision) {
    setResolvingId(revision.id)
    try {
      await revisionsApi.resolve(revision.id)
      toast.success('Change request resolved')
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setResolvingId(null)
      detail.reload()
    }
  }

  async function runStep(video, step) {
    if (step.action.open) {
      revisionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    setStepBusy(true)
    try {
      await videosApi.changeStatus(video.id, step.action.transition)
      toast.success(`${video.title}: ${VIDEO_STATUS_LABEL[step.action.transition]}`)
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setStepBusy(false)
      detail.reload()
    }
  }

  return (
    <DataState state={detail} loading={<PageSkeleton />}>
      {({ video, projectName, clientId, clientName, revisions }) => {
        const step = videoNextStep(video)
        return (
          <>
            <PageHeader
              back={{ to: `/admin/projects/${video.projectId}`, label: projectName }}
              eyebrow={<Link to={`/admin/clients/${clientId}`} className="hover:underline">{clientName}</Link>}
              title={video.title}
              meta={(
                <>
                  <VideoStatusBadge status={video.status} />
                  {video.overdue && <OverdueBadge />}
                  <span className="text-sm text-zinc-500">{CONTENT_TYPE_LABEL[video.contentType]}</span>
                  {video.deadline && <span className={`text-sm ${video.overdue ? 'font-medium text-red-600' : 'text-zinc-500'}`}>· Due {formatDate(video.deadline)}</span>}
                </>
              )}
              actions={(
                <>
                  {video.driveUrl && <DriveLink url={video.driveUrl} />}
                  {/* Corrections and editing are available but out of the way. */}
                  <VideoStatusControl
                    compact
                    key={video.status}
                    video={video}
                    onChanged={detail.reload}
                    corrections="menu"
                    hideForward
                    menuItems={[{ label: 'Edit details', icon: Pencil, onSelect: () => setEditing(true) }]}
                  />
                </>
              )}
            />

            <div className="space-y-5">
              <NextStepCard step={step} onAction={step.action ? () => runStep(video, step) : undefined} actionLoading={stepBusy} />

              <Card className="p-5">
                <VideoTimeline video={video} />
              </Card>

              <div ref={revisionsRef} className="scroll-mt-6">
                <Card>
                  <CardHeader
                    title={`Change requests${video.revisionCount ? ` (${video.revisionCount})` : ''}`}
                    description={video.openRevisionCount > 0 ? `${video.openRevisionCount} open — resolve each one once it’s done in the edit.` : video.revisionCount > 0 ? 'All resolved.' : undefined}
                  />
                  <div className="px-5"><RevisionList revisions={revisions} onResolve={resolve} resolvingId={resolvingId} /></div>
                  <details className="group border-t border-zinc-100">
                    <summary className="cursor-pointer list-none px-5 py-3 text-sm font-medium text-zinc-600 hover:text-zinc-900">
                      + Log a change request <span className="font-normal text-zinc-400">(e.g. feedback from WhatsApp)</span>
                    </summary>
                    <div className="px-5 pb-5">
                      <RevisionForm
                        onSubmit={async (revision) => {
                          await revisionsApi.create(video.id, revision)
                          toast.success('Change request added')
                          detail.reload()
                        }}
                      />
                    </div>
                  </details>
                </Card>
              </div>
            </div>
            {editing && <VideoFormModal open video={video} onClose={() => setEditing(false)} onSaved={detail.reload} />}
          </>
        )
      }}
    </DataState>
  )
}
