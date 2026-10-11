import { useState } from 'react'
import { CheckCircle2, Copy, CreditCard, Film, FolderPlus, Inbox, MessageSquareText, UserPlus } from 'lucide-react'
import { Link } from 'react-router'
import { dashboardApi } from '../../api/dashboard'
import { inquiriesApi } from '../../api/inquiries'
import { paymentsApi } from '../../api/payments'
import { projectsApi } from '../../api/projects'
import { videosApi } from '../../api/videos'
import { toApiError } from '../../api/errors'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { formatDate, formatMoney } from '../../utils/format'
import { VIDEO_STATUS_LABEL } from '../../utils/labels'
import { buildAttention } from '../../utils/workflow'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { ErrorState, PageSkeleton } from '../../components/ui/States'
import { OverdueBadge } from '../../components/ui/StatusBadges'

const KIND_ICON = { inquiry: Inbox, 'empty-project': FolderPlus, payment: CreditCard, video: Film }

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** One queue item with exactly one action: a one-click transition, or a link to where the work happens. */
function AttentionRow({ item, onTransition, busy }) {
  const Icon = item.step?.key === 'resolve-revisions' || item.step?.key === 'post-delivery-revision' ? MessageSquareText : KIND_ICON[item.kind]
  const action = item.step?.action
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${item.overdue ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-600'}`}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={item.href} className="font-medium text-zinc-900 hover:text-accent-700">{item.title}</Link>
          {item.overdue && <OverdueBadge />}
        </div>
        <p className="mt-0.5 text-sm text-zinc-500">
          {item.step ? `${item.step.title} · ` : ''}{item.context}
          {item.video?.deadline && <> · due {formatDate(item.video.deadline)}</>}
        </p>
      </div>
      <div className="sm:shrink-0">
        {action?.transition ? (
          <Button size="sm" loading={busy} onClick={() => onTransition(item)}>{action.label}</Button>
        ) : (
          <ButtonLink to={item.href} size="sm" variant="secondary">{action?.label ?? item.actionLabel}</ButtonLink>
        )}
      </div>
    </li>
  )
}

function WaitingRow({ item, onTransition, busy }) {
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        <Link to={item.href} className="text-sm font-medium text-zinc-800 hover:text-accent-700">{item.title}</Link>
        <p className="text-xs text-zinc-500">{item.step.title} · {item.context}</p>
      </div>
      <Button size="sm" variant="ghost" loading={busy} onClick={() => onTransition(item)}>{item.step.action.label}</Button>
    </li>
  )
}

function FirstRun() {
  const toast = useToast()
  const link = `${window.location.origin}/work-with-me`
  return (
    <Card className="p-8 text-center sm:p-12">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 ring-8 ring-accent-50/50"><Inbox className="size-5" /></div>
      <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">Your workspace is ready</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
        Work arrives as inquiries from your Work With Me page. Accepting one creates the client and their first project — then you add videos and take them from footage to delivery.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button
          icon={Copy}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link)
              toast.success('Work With Me link copied')
            } catch {
              toast.error(link)
            }
          }}
        >
          Copy Work With Me link
        </Button>
        <ButtonLink to="/admin/clients" variant="secondary" icon={UserPlus}>Add a client yourself</ButtonLink>
      </div>
    </Card>
  )
}

export default function Overview() {
  const toast = useToast()
  const [today] = useState(() => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }))
  const [busyId, setBusyId] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const data = useApi(() => Promise.all([
    inquiriesApi.list('PENDING'),
    videosApi.listAll(),
    projectsApi.list('ACTIVE'),
    paymentsApi.overview(),
    dashboardApi.summary(),
  ]), [])

  async function transition(item) {
    setBusyId(item.id)
    try {
      await videosApi.changeStatus(item.video.id, item.step.action.transition)
      toast.success(`${item.video.title}: ${VIDEO_STATUS_LABEL[item.step.action.transition]}`)
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setBusyId(null)
      data.reload()
    }
  }

  // The page always says where you are, even while the queue loads.
  if (data.data === undefined) {
    return (
      <>
        <PageHeader eyebrow={today} title="Today" description="Checking what needs you…" />
        {data.error ? <ErrorState error={data.error} onRetry={data.reload} /> : <PageSkeleton />}
      </>
    )
  }

  const [inquiries, videoItems, activeProjects, overview, summary] = data.data
  const { needsYou, waiting } = buildAttention({ inquiries, videoItems, activeProjects, paymentProjects: overview.projects })
  const nothingYet = summary.totalClients === 0 && inquiries.length === 0
  const shown = showAll ? needsYou : needsYou.slice(0, 7)

  const situation = needsYou.length > 0
    ? `${plural(needsYou.length, 'thing')} need${needsYou.length === 1 ? 's' : ''} you${waiting.length ? ` · ${waiting.length} waiting on clients` : ''}.`
    : waiting.length > 0
      ? `Nothing needs you right now · ${waiting.length} waiting on clients.`
      : 'You’re all caught up.'

  return (
    <>
      <PageHeader eyebrow={today} title="Today" description={nothingYet ? 'Here’s how to get your first project going.' : situation} />

      {nothingYet ? <FirstRun /> : (
        <div className="space-y-6">
          <section>
            <h2 className="eyebrow mb-3 text-zinc-500">Needs you</h2>
            <Card className="overflow-hidden">
              {needsYou.length === 0 ? (
                <div className="flex items-center gap-3 px-5 py-6">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Nothing needs you right now</p>
                    <p className="text-sm text-zinc-500">New inquiries, footage that arrives and client feedback will show up here.</p>
                  </div>
                </div>
              ) : (
                <>
                  <ul className="stagger divide-y divide-zinc-100">
                    {shown.map((item) => <AttentionRow key={item.id} item={item} onTransition={transition} busy={busyId === item.id} />)}
                  </ul>
                  {needsYou.length > shown.length && (
                    <button type="button" onClick={() => setShowAll(true)} className="w-full border-t border-zinc-100 px-5 py-2.5 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-50">
                      Show {needsYou.length - shown.length} more
                    </button>
                  )}
                </>
              )}
            </Card>
          </section>

          {waiting.length > 0 && (
            <section>
              <h2 className="eyebrow mb-1 text-zinc-500">Waiting on clients</h2>
              <p className="mb-3 text-sm text-zinc-500">Update these when footage arrives or the client approves.</p>
              <Card className="overflow-hidden">
                <ul className="divide-y divide-zinc-100">
                  {waiting.slice(0, 6).map((item) => <WaitingRow key={item.id} item={item} onTransition={transition} busy={busyId === item.id} />)}
                </ul>
                {waiting.length > 6 && <Link to="/admin/videos" className="block border-t border-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">See all {waiting.length}</Link>}
              </Card>
            </section>
          )}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-zinc-200/80 pt-5 text-sm sm:grid-cols-4">
            <div><dt className="text-zinc-500">Active projects</dt><dd className="mt-0.5 font-display text-lg font-bold"><Link to="/admin/projects" className="hover:text-accent-700">{summary.activeProjects}</Link></dd></div>
            <div><dt className="text-zinc-500">Videos in progress</dt><dd className="mt-0.5 font-display text-lg font-bold">{summary.videos.total - summary.videos.done}</dd></div>
            <div><dt className="text-zinc-500">Clients</dt><dd className="mt-0.5 font-display text-lg font-bold"><Link to="/admin/clients" className="hover:text-accent-700">{summary.totalClients}</Link></dd></div>
            <div><dt className="text-zinc-500">Outstanding</dt><dd className="mt-0.5 font-display text-lg font-bold"><Link to="/admin/payments" className="hover:text-accent-700">{formatMoney(overview.outstanding)}</Link></dd></div>
          </dl>
        </div>
      )}
    </>
  )
}
