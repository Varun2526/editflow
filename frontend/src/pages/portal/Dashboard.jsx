import { ArrowRight, CheckCircle2, Eye, FolderKanban, UploadCloud } from 'lucide-react'
import { Link } from 'react-router'
import { portalApi } from '../../api/portal'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMoney, formatPeriod } from '../../utils/format'
import { clientSituation } from '../../utils/workflow'
import { ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { EmptyState, ErrorState, PageSkeleton } from '../../components/ui/States'
import { PaymentStatusBadge } from '../../components/ui/StatusBadges'

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** The client's home: what's happening, what we need from them, and where the money stands. */
export default function Dashboard() {
  const data = useApi(async () => {
    const dashboard = await portalApi.dashboard()
    const videos = dashboard.currentProject ? await portalApi.projectVideos(dashboard.currentProject.id) : []
    return { dashboard, videos }
  }, [])

  if (data.data === undefined) return data.error ? <ErrorState error={data.error} onRetry={data.reload} /> : <PageSkeleton />
  const { dashboard, videos } = data.data
  const project = dashboard.currentProject

  if (!project) {
    return (
      <Card>
        <EmptyState
          icon={FolderKanban}
          title={`Welcome, ${dashboard.clientName}`}
          description="Your editor is setting up your first project. Once it’s ready, you’ll follow every video here — from footage to delivery — and see what’s been paid."
        />
      </Card>
    )
  }

  const s = clientSituation(project, videos)
  const stages = [
    s.review.length && `${s.review.length} ready for review`,
    s.inProduction.length && `${s.inProduction.length} in production`,
    s.approved.length && `${s.approved.length} approved`,
    s.awaitingFootage.length && `${s.awaitingFootage.length} waiting for footage`,
    s.delivered.length && `${s.delivered.length} delivered`,
  ].filter(Boolean)

  return (
    <div className="stagger space-y-6">
      <div>
        <p className="eyebrow text-zinc-500">{project.name} · {formatPeriod(project.month, project.year)}</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight sm:text-4xl">{s.headline}</h1>
      </div>

      {s.review.length > 0 && (
        <section className="rounded-2xl border border-zinc-300 bg-gradient-to-br from-zinc-50 via-white to-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white"><Eye className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-zinc-900">Your turn</p>
              <h2 className="mt-1 font-display text-xl font-bold tracking-tight">Review {plural(s.review.length, 'video')}</h2>
              <p className="mt-1 text-sm text-zinc-600">Watch each one, then approve it — or request a revision with the timecode of what to change.</p>
              <ul className="mt-4 divide-y divide-zinc-200/70 rounded-xl border border-zinc-200/80 bg-white">
                {s.review.map((video) => (
                  <li key={video.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{video.title}</span>
                      {video.deadline && <span className="text-xs text-zinc-500">Due {formatDate(video.deadline)}</span>}
                    </span>
                    <ButtonLink to={`/portal/videos/${video.id}`} size="sm">Review video</ButtonLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {s.awaitingFootage.length > 0 && (
        <section className="flex items-start gap-3 rounded-2xl border border-zinc-200/80 bg-white p-5">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600"><UploadCloud className="size-4" /></span>
          <div>
            <h2 className="text-sm font-semibold">Your editor is waiting for footage for {plural(s.awaitingFootage.length, 'video')}</h2>
            <p className="mt-1 text-sm text-zinc-600">Share the raw footage on Google Drive. Editing starts as soon as it arrives.</p>
            <p className="mt-2 text-xs text-zinc-500">{s.awaitingFootage.slice(0, 4).map((v) => v.title).join(' · ')}{s.awaitingFootage.length > 4 ? ` · +${s.awaitingFootage.length - 4} more` : ''}</p>
          </div>
        </section>
      )}

      {s.review.length === 0 && s.awaitingFootage.length === 0 && (
        <section className="flex items-start gap-3 rounded-2xl border border-zinc-200/80 bg-white p-5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <div>
            <h2 className="text-sm font-semibold">Nothing needed from you right now</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {s.openChanges > 0 ? `Your editor is working on ${plural(s.openChanges, 'change request')}. ` : ''}
              We’ll show videos here as soon as they’re ready for your review.
            </p>
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">Progress</h2>
            <span className="text-sm text-zinc-500">{project.videos.done} of {project.videos.total} done</span>
          </div>
          <ProgressBar percent={project.videos.progressPercent} className="mt-3" />
          {stages.length > 0 && <p className="mt-3 text-sm text-zinc-600">{stages.join(' · ')}</p>}
          <Link to={`/portal/projects/${project.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-700 hover:text-zinc-500">
            See every video <ArrowRight className="size-4" />
          </Link>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Payment</h2>
            <PaymentStatusBadge status={project.payment.status} />
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight">{formatMoney(project.payment.balance)}</p>
          <p className="text-sm text-zinc-500">remaining of {formatMoney(project.payment.totalFee)}</p>
          <p className="mt-3 text-xs text-zinc-500">
            {s.balance > 0 ? 'Pay your editor by UPI — it appears here once they record it.' : 'Fully paid. Thank you!'}
          </p>
          <Link to={`/portal/payments?project=${project.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-700 hover:text-zinc-500">
            Payment history <ArrowRight className="size-4" />
          </Link>
        </Card>
      </div>
    </div>
  )
}
