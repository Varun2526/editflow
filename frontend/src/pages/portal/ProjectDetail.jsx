import { Film } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { portalApi } from '../../api/portal'
import { useApi } from '../../hooks/useApi'
import { formatPeriod } from '../../utils/format'
import { clientSituation } from '../../utils/workflow'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { DataState, EmptyState, PageSkeleton } from '../../components/ui/States'
import { ProjectStatusBadge } from '../../components/ui/StatusBadges'
import { ClientVideoList } from '../../components/domain/ClientVideoList'
import { PaymentSummary } from '../../components/domain/PaymentSummary'

function Group({ title, hint, videos }) {
  if (videos.length === 0) return null
  return (
    <div>
      <div className="border-b border-zinc-100 bg-zinc-50/60 px-5 py-2.5">
        <p className="text-[13px] font-semibold text-zinc-800">{title} <span className="font-normal text-zinc-400">{videos.length}</span></p>
        <p className="text-xs text-zinc-500">{hint}</p>
      </div>
      <ClientVideoList videos={videos} />
    </div>
  )
}

/** A client's project: videos grouped by what they mean for the client, plus payments. */
export default function ProjectDetail() {
  const { id } = useParams()
  const project = useApi(() => portalApi.project(id), [id])
  const videos = useApi(() => portalApi.projectVideos(id), [id])

  return (
    <DataState state={project} loading={<PageSkeleton />}>
      {(p) => {
        const s = videos.data ? clientSituation(p, videos.data) : null
        return (
          <>
            <PageHeader
              back={{ to: '/portal/projects', label: 'Projects' }}
              title={p.name}
              description={s?.headline}
              meta={<><span className="text-sm text-zinc-500">{formatPeriod(p.month, p.year)}</span><ProjectStatusBadge status={p.status} /></>}
            />
            <div className="space-y-4">
              <Card className="p-5">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-zinc-500">{p.videos.done} of {p.videos.total} videos done</span>
                  <span className="font-medium tabular">{p.videos.progressPercent}%</span>
                </div>
                <ProgressBar percent={p.videos.progressPercent} />
                {p.description && <p className="mt-4 text-sm text-zinc-600">{p.description}</p>}
              </Card>
              <Card className="overflow-hidden">
                <DataState
                  state={videos}
                  isEmpty={(list) => list.length === 0}
                  empty={<EmptyState compact icon={Film} title="No videos planned yet" description="Your editor adds this month’s videos here. You’ll be able to follow each one from footage to delivery." />}
                >
                  {() => (
                    <>
                      <Group title="Ready for your review" hint="Watch each one, then approve it or request a revision." videos={s.review} />
                      <Group title="Waiting for your footage" hint="Share the raw footage on Google Drive to get these started." videos={s.awaitingFootage} />
                      <Group title="In production" hint="Your editor is working on these." videos={s.inProduction} />
                      <Group title="Approved — ready for delivery" hint="You approved these. Your editor will deliver them." videos={s.approved} />
                      <Group title="Delivered" hint="Final videos — download them from Drive." videos={s.delivered} />
                    </>
                  )}
                </DataState>
              </Card>
              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Payment</h2>
                  <Link to={`/portal/payments?project=${p.id}`} className="text-sm text-zinc-500 hover:text-zinc-900">History</Link>
                </div>
                <PaymentSummary summary={p.payment} />
              </Card>
            </div>
          </>
        )
      }}
    </DataState>
  )
}
