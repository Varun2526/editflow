import { useMemo, useState } from 'react'
import { Archive, CheckCheck, ChevronDown, Film, MessageSquareText, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { paymentsApi } from '../../api/payments'
import { projectsApi } from '../../api/projects'
import { videosApi } from '../../api/videos'
import { toApiError } from '../../api/errors'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { formatDate, formatMoney, formatPeriod } from '../../utils/format'
import { CONTENT_TYPE_LABEL, VIDEO_STATUS_LABEL } from '../../utils/labels'
import { groupByTurn, projectNextStep, videoNextStep } from '../../utils/workflow'
import { ActionMenu } from '../../components/ui/ActionMenu'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { DriveLink } from '../../components/ui/DriveLink'
import { PageHeader } from '../../components/ui/PageHeader'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { DataState, EmptyState, PageSkeleton } from '../../components/ui/States'
import { OverdueBadge, PaymentStatusBadge, ProjectStatusBadge, VideoStatusBadge } from '../../components/ui/StatusBadges'
import { NextStepCard } from '../../components/domain/NextStepCard'
import { PaymentFormModal } from '../../components/domain/PaymentFormModal'
import { ProjectFormModal } from '../../components/domain/ProjectFormModal'
import { StageRail } from '../../components/domain/StageRail'
import { VideoFormModal } from '../../components/domain/VideoFormModal'
import { VideoStatusControl } from '../../components/domain/VideoStatusControl'

const STATUS_ACTIONS = {
  ACTIVE: [{ status: 'COMPLETED', label: 'Mark project completed', icon: CheckCheck }, { status: 'ARCHIVED', label: 'Archive project', icon: Archive }],
  COMPLETED: [{ status: 'ACTIVE', label: 'Reactivate project', icon: RotateCcw }, { status: 'ARCHIVED', label: 'Archive project', icon: Archive }],
  ARCHIVED: [{ status: 'ACTIVE', label: 'Restore project', icon: RotateCcw }],
}

/** One video: what it is, what's happening with it, and the single next action. */
function VideoRow({ video, onChanged, onEdit, onDelete }) {
  const step = videoNextStep(video)
  return (
    <li className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-zinc-50/60 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/admin/videos/${video.id}`} className="font-medium text-zinc-900 hover:text-zinc-500">{video.title}</Link>
          <VideoStatusBadge status={video.status} />
          {video.overdue && <OverdueBadge />}
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
          <span>{CONTENT_TYPE_LABEL[video.contentType]}</span>
          {video.deadline && <span className={video.overdue ? 'font-medium text-red-600' : ''}>Due {formatDate(video.deadline)}</span>}
          {video.openRevisionCount > 0 && (
            <Link to={`/admin/videos/${video.id}`} className="inline-flex items-center gap-1 font-medium text-yellow-800 hover:underline">
              <MessageSquareText className="size-3.5" />{video.openRevisionCount} open
            </Link>
          )}
          {video.driveUrl && <DriveLink url={video.driveUrl} label="Drive" />}
        </p>
        {step.owner !== 'done' && <p className="mt-1.5 text-[13px] text-zinc-600">{step.title}</p>}
      </div>
      <div className="flex items-center justify-end gap-1 sm:shrink-0">
        {step.action?.open && (
          <ButtonLink to={`/admin/videos/${video.id}`} size="sm" variant="primary">{step.action.label}</ButtonLink>
        )}
        <VideoStatusControl
          compact
          video={video}
          onChanged={onChanged}
          corrections="menu"
          hideForward={Boolean(step.action?.open)}
          menuItems={[
            { label: 'Edit details', icon: Pencil, onSelect: () => onEdit(video) },
            { label: 'Delete video', icon: Trash2, danger: true, onSelect: () => onDelete(video), hidden: video.status === 'DELIVERED' },
          ]}
        />
      </div>
    </li>
  )
}

function VideoGroup({ title, hint, videos, collapsible = false, ...rowProps }) {
  const [open, setOpen] = useState(!collapsible)
  if (videos.length === 0) return null
  return (
    <div>
      <button
        type="button"
        onClick={() => collapsible && setOpen((value) => !value)}
        className={`flex w-full items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/60 px-5 py-2.5 text-left ${collapsible ? 'cursor-pointer hover:bg-zinc-50' : 'cursor-default'}`}
        aria-expanded={open}
      >
        <span className="text-[13px] font-semibold text-zinc-800">
          {title} <span className="font-normal text-zinc-400 tabular">{videos.length}</span>
          {hint && <span className="ml-2 font-normal text-zinc-500">{hint}</span>}
        </span>
        {collapsible && <ChevronDown className={`size-4 text-zinc-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && <ul className="divide-y divide-zinc-100">{videos.map((video) => <VideoRow key={video.id} video={video} {...rowProps} />)}</ul>}
    </div>
  )
}

function PaymentsPanel({ project, payments, onRecord, onDelete }) {
  const [showAll, setShowAll] = useState(false)
  const list = payments.data?.payments ?? []
  const shown = showAll ? list : list.slice(0, 3)
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Payment</h2>
        <PaymentStatusBadge status={project.payment.status} />
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight">{formatMoney(project.payment.balance)}</p>
      <p className="text-sm text-zinc-500">remaining of {formatMoney(project.payment.totalFee)}</p>
      <ProgressBar
        size="sm"
        className="mt-3"
        percent={Number(project.payment.totalFee) > 0 ? (Number(project.payment.totalPaid) / Number(project.payment.totalFee)) * 100 : 100}
      />
      {Number(project.payment.balance) > 0 && (
        <Button size="sm" variant="secondary" icon={Plus} className="mt-4 w-full" onClick={onRecord}>Record payment</Button>
      )}
      <div className="mt-5 border-t border-zinc-100 pt-4">
        <p className="text-xs font-medium text-zinc-500">History</p>
        {list.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No payments yet. Record UPI payments here as they arrive.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {shown.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0">
                  <span className="font-medium tabular">{formatMoney(payment.amount)}</span>
                  <span className="ml-2 text-zinc-500">{formatDate(payment.paymentDate)}</span>
                  {payment.note && <span className="block truncate text-xs text-zinc-400">{payment.note}</span>}
                </span>
                <ActionMenu items={[{ label: 'Delete payment', icon: Trash2, danger: true, onSelect: () => onDelete(payment) }]} />
              </li>
            ))}
          </ul>
        )}
        {list.length > 3 && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 text-xs font-medium text-zinc-500 hover:text-zinc-900">
            {showAll ? 'Show fewer' : `Show all ${list.length}`}
          </button>
        )}
      </div>
    </Card>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const project = useApi(() => projectsApi.get(id), [id])
  const videos = useApi(() => videosApi.listForProject(id), [id])
  const payments = useApi(() => paymentsApi.listForProject(id), [id])
  const [stage, setStage] = useState(null)
  const [adding, setAdding] = useState(false)
  const [editingVideo, setEditingVideo] = useState(null)
  const [deletingVideo, setDeletingVideo] = useState(null)
  const [editingProject, setEditingProject] = useState(false)
  const [statusChange, setStatusChange] = useState(null)
  const [recording, setRecording] = useState(false)
  const [deletingPayment, setDeletingPayment] = useState(null)
  const [stepBusy, setStepBusy] = useState(false)

  // Every change re-fetches the backend's view of the project, its videos and payments.
  const refreshAll = () => { project.reload(); videos.reload(); payments.reload() }

  const list = useMemo(() => videos.data ?? [], [videos.data])
  const groups = useMemo(() => groupByTurn(list), [list])
  const counts = useMemo(() => list.reduce((acc, v) => ({ ...acc, [v.status]: (acc[v.status] ?? 0) + 1 }), {}), [list])

  async function runNextStep(step) {
    const action = step.action
    if (action.kind === 'add-video') return setAdding(true)
    if (action.kind === 'record-payment') return setRecording(true)
    if (action.kind === 'complete-project') return setStatusChange(STATUS_ACTIONS.ACTIVE[0])
    if (action.open) return navigate(`/admin/videos/${step.video.id}`)
    if (action.transition && step.video) {
      setStepBusy(true)
      try {
        await videosApi.changeStatus(step.video.id, action.transition)
        toast.success(`${step.video.title}: ${VIDEO_STATUS_LABEL[action.transition]}`)
      } catch (err) {
        toast.error(toApiError(err).message)
      } finally {
        setStepBusy(false)
        refreshAll()
      }
    }
    return undefined
  }

  return (
    <DataState state={project} loading={<PageSkeleton />}>
      {(p) => {
        const step = videos.data ? projectNextStep(p, list) : null
        const filtered = stage ? list.filter((v) => v.status === stage) : null
        const rowProps = { onChanged: refreshAll, onEdit: setEditingVideo, onDelete: setDeletingVideo }
        return (
          <>
            <PageHeader
              back={{ to: '/admin/projects', label: 'Projects' }}
              eyebrow={<Link to={`/admin/clients/${p.clientId}`} className="hover:underline">{p.clientName}</Link>}
              title={p.name}
              meta={(
                <>
                  <span className="text-sm text-zinc-500">{formatPeriod(p.month, p.year)}</span>
                  <ProjectStatusBadge status={p.status} />
                </>
              )}
              actions={(
                <>
                  {p.status !== 'ARCHIVED' && <Button icon={Plus} onClick={() => setAdding(true)}>Add video</Button>}
                  <ActionMenu
                    label="Project actions"
                    items={[
                      { label: 'Edit project', icon: Pencil, onSelect: () => setEditingProject(true) },
                      ...STATUS_ACTIONS[p.status].map((action) => ({ label: action.label, icon: action.icon, onSelect: () => setStatusChange(action) })),
                    ]}
                  />
                </>
              )}
            />

            <div className="space-y-5">
              <NextStepCard step={step} onAction={step?.action ? () => runNextStep(step) : undefined} actionLoading={stepBusy} />

              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-w-0 space-y-4">
                  <div>
                    <div className="mb-2.5 flex items-baseline justify-between gap-3">
                      <h2 className="text-sm font-semibold text-zinc-900">
                        Production <span className="font-normal text-zinc-500">· {p.videos.done} of {p.videos.total} done</span>
                      </h2>
                      {p.videos.overdue > 0 && <span className="text-sm font-medium text-red-600">{p.videos.overdue} overdue</span>}
                    </div>
                    <StageRail counts={counts} active={stage} onSelect={setStage} />
                  </div>

                  <Card className="overflow-hidden">
                    <DataState
                      state={videos}
                      isEmpty={(all) => all.length === 0}
                      empty={(
                        <EmptyState
                          icon={Film}
                          title="No videos in this project yet"
                          description="Add each video planned for this month. They start as Pending until the client's footage arrives."
                          action={p.status !== 'ARCHIVED' && <Button size="sm" icon={Plus} onClick={() => setAdding(true)}>Add first video</Button>}
                        />
                      )}
                    >
                      {() => (filtered ? (
                        <>
                          <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/60 px-5 py-2.5">
                            <span className="text-[13px] font-semibold text-zinc-800">{VIDEO_STATUS_LABEL[stage]} <span className="font-normal text-zinc-400">{filtered.length}</span></span>
                            <button type="button" onClick={() => setStage(null)} className="text-xs font-medium text-zinc-500 hover:text-zinc-900">Show all</button>
                          </div>
                          {filtered.length === 0
                            ? <p className="px-5 py-6 text-sm text-zinc-500">No videos at this stage.</p>
                            : <ul className="divide-y divide-zinc-100">{filtered.map((video) => <VideoRow key={video.id} video={video} {...rowProps} />)}</ul>}
                        </>
                      ) : (
                        <>
                          <VideoGroup title="Your turn" hint="needs you" videos={groups.admin} {...rowProps} />
                          <VideoGroup title="Waiting on client" hint="footage or feedback" videos={groups.client} {...rowProps} />
                          <VideoGroup title="Delivered" videos={groups.done} collapsible={groups.admin.length + groups.client.length > 0} {...rowProps} />
                        </>
                      ))}
                    </DataState>
                  </Card>
                </div>

                <aside className="space-y-4">
                  <PaymentsPanel project={p} payments={payments} onRecord={() => setRecording(true)} onDelete={setDeletingPayment} />
                  <Card className="p-5 text-sm">
                    <h2 className="font-semibold">Client</h2>
                    <Link to={`/admin/clients/${p.clientId}`} className="mt-1 block font-medium text-zinc-800 hover:text-zinc-500">{p.clientName}</Link>
                    {p.description && <p className="mt-3 border-t border-zinc-100 pt-3 text-zinc-600">{p.description}</p>}
                  </Card>
                </aside>
              </div>
            </div>

            {adding && <VideoFormModal open projectId={p.id} onClose={() => setAdding(false)} onSaved={refreshAll} />}
            {editingVideo && <VideoFormModal key={editingVideo.id} open video={editingVideo} onClose={() => setEditingVideo(null)} onSaved={refreshAll} />}
            {editingProject && <ProjectFormModal open project={p} onClose={() => setEditingProject(false)} onSaved={project.reload} />}
            {recording && <PaymentFormModal open projectId={p.id} balance={p.payment.balance} onClose={() => setRecording(false)} onSaved={refreshAll} />}
            <ConfirmDialog
              open={Boolean(deletingVideo)}
              onClose={() => setDeletingVideo(null)}
              title="Delete video?"
              message={deletingVideo ? `“${deletingVideo.title}” and its revisions will be permanently deleted.` : ''}
              confirmLabel="Delete"
              danger
              onConfirm={async () => {
                await videosApi.remove(deletingVideo.id)
                toast.success('Video deleted')
                refreshAll()
              }}
            />
            <ConfirmDialog
              open={Boolean(deletingPayment)}
              onClose={() => setDeletingPayment(null)}
              title="Delete payment?"
              message={deletingPayment ? `Remove the ${formatMoney(deletingPayment.amount)} payment from ${formatDate(deletingPayment.paymentDate)}? Payments can't be edited, so delete and re-record to correct a mistake.` : ''}
              confirmLabel="Delete payment"
              danger
              onConfirm={async () => {
                await paymentsApi.remove(deletingPayment.id)
                toast.success('Payment deleted')
                refreshAll()
              }}
            />
            <ConfirmDialog
              open={Boolean(statusChange)}
              onClose={() => setStatusChange(null)}
              title={statusChange ? `${statusChange.label}?` : ''}
              message={statusChange?.status === 'ARCHIVED'
                ? 'Archived projects are hidden from active work and excluded from dashboard totals.'
                : statusChange?.status === 'COMPLETED'
                  ? 'The project moves out of your active work. You can reactivate it later.'
                  : 'The project returns to your active work.'}
              confirmLabel={statusChange?.label}
              onConfirm={async () => {
                await projectsApi.changeStatus(p.id, statusChange.status)
                toast.success({ COMPLETED: 'Project marked completed', ARCHIVED: 'Project archived', ACTIVE: 'Project is active again' }[statusChange.status])
                project.reload()
              }}
            />
          </>
        )
      }}
    </DataState>
  )
}
