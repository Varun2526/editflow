import { FolderKanban } from 'lucide-react'
import { Link } from 'react-router'
import { portalApi } from '../../api/portal'
import { useApi } from '../../hooks/useApi'
import { formatMoney, formatPeriod } from '../../utils/format'
import { Card } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { DataState, EmptyState } from '../../components/ui/States'
import { PaymentStatusBadge, ProjectStatusBadge } from '../../components/ui/StatusBadges'

export default function Projects() {
  const projects = useApi(() => portalApi.projects(), [])
  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">Projects</h1>
      <DataState
        state={projects}
        isEmpty={(list) => list.length === 0}
        empty={<Card><EmptyState icon={FolderKanban} title="No projects yet" description="Your editor creates a project for each month of work. It will appear here with every video and payment." /></Card>}
      >
        {(list) => (
          <div className="stagger grid gap-4 sm:grid-cols-2">
            {list.map((p) => (
              <Link key={p.id} to={`/portal/projects/${p.id}`} className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/[0.02] transition-[transform,box-shadow,border-color] duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-900/[0.06]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{formatPeriod(p.month, p.year)}</p>
                    <p className="mt-1 font-semibold">{p.name}</p>
                  </div>
                  <ProjectStatusBadge status={p.status} />
                </div>
                <div className="mt-5 flex justify-between text-sm">
                  <span className="text-zinc-500">{p.videos.done} of {p.videos.total} videos completed</span>
                </div>
                <ProgressBar percent={p.videos.progressPercent} size="sm" className="mt-2" />
                <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4 text-sm">
                  <span className="text-zinc-500">Fee <span className="font-medium text-zinc-900 tabular">{formatMoney(p.totalFee)}</span></span>
                  <PaymentStatusBadge status={p.payment.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </DataState>
    </>
  )
}
