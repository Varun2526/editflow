import { useRef, useState } from 'react'
import { Check, ExternalLink, MessageSquareText } from 'lucide-react'
import { useParams } from 'react-router'
import { portalApi } from '../../api/portal'
import { toApiError } from '../../api/errors'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/format'
import { CONTENT_TYPE_LABEL } from '../../utils/labels'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { DriveLink } from '../../components/ui/DriveLink'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataState, PageSkeleton } from '../../components/ui/States'
import { OverdueBadge, VideoStatusBadge } from '../../components/ui/StatusBadges'
import { RevisionForm } from '../../components/domain/RevisionForm'
import { RevisionList } from '../../components/domain/RevisionList'
import { NextStepCard } from '../../components/domain/NextStepCard'
import { clientVideoStep } from '../../utils/workflow'

// Mirrors the backend rules purely to decide what to show; the backend still enforces them (409).
const REVIEWABLE = ['REVIEW', 'COMPLETED', 'DELIVERED']

const shortDate = (instant) => new Date(instant).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/** The three choices on a video that is ready for review: watch it, approve it, or ask for changes. */
function ReviewActions({ video, onApprove, approving, onRequestRevision }) {
  return (
    <section aria-label="Review this video" className="rounded-2xl border border-zinc-300 bg-gradient-to-br from-zinc-50 via-white to-white p-5 shadow-sm shadow-zinc-900/[0.03] sm:p-6">
      <p className="eyebrow text-zinc-900">Your turn</p>
      <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-zinc-900">Ready for your review</h2>
      <p className="mt-1 text-sm text-zinc-600">Watch the video, then approve it — or request a revision with the timecode of what to change.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {video.driveUrl && (
          <a
            href={video.driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
          >
            <ExternalLink className="size-4" /> Watch video
          </a>
        )}
        <Button icon={Check} loading={approving} onClick={onApprove}>Approve video</Button>
        <Button variant="secondary" icon={MessageSquareText} onClick={onRequestRevision}>Request revision</Button>
      </div>
      <p className="mt-3 text-xs text-zinc-500">Approving tells your editor it’s final and ready for delivery.</p>
    </section>
  )
}

/** Client view of a video: status, deadline, Drive link, approval and revisions. No editor controls. */
export default function VideoDetail() {
  const { id } = useParams()
  const toast = useToast()
  const detail = useApi(() => portalApi.video(id), [id])
  const [approving, setApproving] = useState(false)
  const revisionRef = useRef(null)

  async function approve(video) {
    setApproving(true)
    try {
      await portalApi.approveVideo(video.id)
      toast.success('Video approved — your editor will deliver it')
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setApproving(false)
      detail.reload()
    }
  }

  function focusRevisionForm() {
    revisionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    revisionRef.current?.querySelector('input')?.focus({ preventScroll: true })
  }

  return (
    <DataState state={detail} loading={<PageSkeleton />}>
      {({ video, projectName, revisions }) => {
        const step = clientVideoStep(video)
        return (
          <>
            <PageHeader
              back={{ to: `/portal/projects/${video.projectId}`, label: projectName }}
              title={video.title}
              meta={<><VideoStatusBadge status={video.status} />{video.overdue && <OverdueBadge />}</>}
            />
            <div className="mb-5">
              {step.key === 'review'
                ? <ReviewActions video={video} approving={approving} onApprove={() => approve(video)} onRequestRevision={focusRevisionForm} />
                : <NextStepCard step={step} audience="client" />}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="h-fit p-5">
                <dl className="space-y-3 text-sm">
                  <div><dt className="text-xs text-zinc-500">Content type</dt><dd>{CONTENT_TYPE_LABEL[video.contentType]}</dd></div>
                  <div><dt className="text-xs text-zinc-500">Deadline</dt><dd>{formatDate(video.deadline)}</dd></div>
                  {video.approvedAt && <div><dt className="text-xs text-zinc-500">Approved</dt><dd>{shortDate(video.approvedAt)}</dd></div>}
                  {video.deliveredAt && <div><dt className="text-xs text-zinc-500">Delivered</dt><dd>{shortDate(video.deliveredAt)}</dd></div>}
                  <div><dt className="text-xs text-zinc-500">Files</dt><dd className="mt-0.5"><DriveLink url={video.driveUrl} /></dd></div>
                </dl>
              </Card>
              <Card className="lg:col-span-2">
                <CardHeader title={`Revisions (${video.revisionCount})`} />
                <div className="px-5"><RevisionList revisions={revisions} /></div>
                <div ref={revisionRef} className="scroll-mt-6 border-t border-zinc-100 p-5">
                  {REVIEWABLE.includes(video.status) ? (
                    <>
                      <p className="mb-1 text-sm font-medium">{video.status === 'REVIEW' ? 'Request a revision' : 'Need a change?'}</p>
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
        )
      }}
    </DataState>
  )
}
