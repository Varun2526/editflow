import { CreditCard } from 'lucide-react'
import { Link } from 'react-router'
import { paymentsApi } from '../../api/payments'
import { useApi } from '../../hooks/useApi'
import { formatDate, formatMoney } from '../../utils/format'
import { Card, CardHeader } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { DataState, EmptyState, PageSkeleton } from '../../components/ui/States'
import { ProjectTable } from '../../components/domain/ProjectTable'

export default function Payments() {
  const overview = useApi(() => paymentsApi.overview(), [])

  return (
    <>
      <PageHeader title="Payments" description="UPI payments recorded against active and completed projects. Record payments from a project." />
      <DataState state={overview} loading={<PageSkeleton />}>
        {(o) => (
          <div className="space-y-4">
            <div className="stagger grid gap-4 sm:grid-cols-3">
              <StatCard label="Billed" value={o.totalFees} format={formatMoney} />
              <StatCard label="Received" value={o.totalPaid} format={formatMoney} />
              <StatCard label="Outstanding" value={o.outstanding} format={formatMoney} tone={Number(o.outstanding) > 0 ? 'accent' : 'default'} />
            </div>
            <Card>
              <CardHeader title="Projects" />
              {o.projects.length === 0
                ? <EmptyState compact title="No projects to bill yet" description="Each project’s fee and payments appear here once you have an active project." />
                : <ProjectTable projects={o.projects} />}
            </Card>
            <Card>
              <CardHeader title="Recent payments" />
              {o.recentPayments.length === 0 ? (
                <EmptyState icon={CreditCard} title="No payments recorded yet" description="When a client pays you by UPI, open their project and choose “Record payment”. Totals and balances update automatically." />
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {o.recentPayments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3">
                      <div className="min-w-0">
                        <Link to={`/admin/projects/${p.projectId}`} className="text-sm font-medium text-zinc-900 hover:text-zinc-500">{p.clientName}</Link>
                        <p className="truncate text-xs text-zinc-500">{p.projectName}{p.note && ` · ${p.note}`}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular">{formatMoney(p.amount)}</p>
                        <p className="text-xs text-zinc-500">{formatDate(p.paymentDate)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </DataState>
    </>
  )
}
