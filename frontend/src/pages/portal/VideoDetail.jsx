import { useParams } from 'react-router'
import { portalApi } from '../../api/portal'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/format'
import { CONTENT_TYPE_LABEL } from '../../utils/labels'
import { Card, CardHeader } from '../../components/ui/Card'
import { DriveLink } from '../../components/ui/DriveLink'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataState, PageSkeleton } from '../../components/ui/States'
import { OverdueBadge, VideoStatusBadge } from '../../components/ui/StatusBadges'
import { RevisionForm } from '../../components/domain/RevisionForm'
import { RevisionList } from '../../components/domain/RevisionList'
import { NextStepCard } from '../../components/domain/NextStepCard'
import { clientVideoStep } from '../../utils/workflow'

// Mirrors the backend rule purely to decide whether to show the form; the backend still enforces it (409).
const REVIEWABLE = ['REVIEW', 'COMPLETED', 'DELIVERED']

/** Client view of a video: status, deadline, Drive link and revisions. No workflow controls. */
export default function VideoDetail() {
  const { id } = useParams()
  const toast = useToast()
  const detail = useApi(() => portalApi.video(id), [id])

  return (
    <DataState state={detail} loading={<PageSkeleton />}>
      {({ video, projectName, revisions }) => (
        <>
          <PageHeader
            back={{ to: `/portal/projects/${video.projectId}`, label: projectName }}
            title={video.title}
            meta={<><VideoStatusBadge status={video.status} />{video.overdue && <OverdueBadge />}</>}
          />
          <div className="mb-5"><NextStepCard step={clientVideoStep(video)} audience="client" /></div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="h-fit p-5">
              <dl className="space-y-3 text-sm">
                <div><dt className="text-xs text-zinc-500">Content type</dt><dd>{CONTENT_TYPE_LABEL[video.contentType]}</dd></div>
                <div><dt className="text-xs text-zinc-500">Deadline</dt><dd>{formatDate(video.deadline)}</dd></div>
                {video.deliveredAt && <div><dt className="text-xs text-zinc-500">Delivered</dt><dd>{new Date(video.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</dd></div>}
                <div><dt className="text-xs text-zinc-500">Files</dt><dd className="mt-0.5"><DriveLink url={video.driveUrl} /></dd></div>
              </dl>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title={`Revisions (${video.revisionCount})`} />
              <div className="px-5"><RevisionList revisions={revisions} /></div>
              <div className="border-t border-zinc-100 p-5">
                {REVIEWABLE.includes(video.status) ? (
                  <>
                    <p className="mb-1 text-sm font-medium">{video.status === 'REVIEW' ? 'Want something changed?' : 'Need a change?'}</p>
                    <p className="mb-3 text-xs text-zinc-500">Give the timecode where the change is needed (e.g. 00:17 or 01:02:30) and describe it. Your editor sees it straight away.</p>
                    <RevisionForm
                      submitLabel="Send request"
                      onSubmit={async (revision) => {
                        await portalApi.requestRevision(video.id, revision)
                        toast.success('Revision request sent')
                        detail.reload()
                      }}
                    />
                  </>
                ) : (
                  <p className="text-sm text-zinc-500">You’ll be able to request changes here once this video is ready for your review.</p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </DataState>
  )
}
