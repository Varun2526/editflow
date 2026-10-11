import { CreditCard } from 'lucide-react'
import { portalApi } from '../../api/portal'
import { useApi } from '../../hooks/useApi'
import { usePortalProjectSelection } from '../../hooks/usePortalProjectSelection'
import { formatDate, formatMoney } from '../../utils/format'
import { Card, CardHeader } from '../../components/ui/Card'
import { DataState, EmptyState } from '../../components/ui/States'
import { PaymentSummary } from '../../components/domain/PaymentSummary'
import { ProjectPicker } from '../../components/domain/ProjectPicker'

export default function Payments() {
  const selection = usePortalProjectSelection()
  const payments = useApi(
    () => (selection.selectedId ? portalApi.projectPayments(selection.selectedId) : Promise.resolve(null)),
    [selection.selectedId],
  )

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">Payments</h1>
        <ProjectPicker projects={selection.projects} value={selection.selectedId} onChange={selection.select} />
      </div>
      <DataState state={selection.state}>
        {() => (
          <DataState state={payments} isEmpty={(d) => d === null} empty={<Card><EmptyState icon={CreditCard} title="No projects yet" description="Payment details appear here once your editor sets up your first project." /></Card>}>
            {(data) => (
              <div className="space-y-4">
                <Card className="p-5"><PaymentSummary summary={data.summary} /></Card>
                <Card>
                  <CardHeader title="Payment history" />
                  {data.payments.length === 0 ? (
                    <EmptyState compact title="No payments recorded yet" description="Pay your editor by UPI — each payment appears here once they record it." />
                  ) : (
                    <ul className="divide-y divide-zinc-100">
                      {data.payments.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3">
                          <div>
                            <p className="text-sm font-medium tabular">{formatMoney(p.amount)}</p>
                            {p.note && <p className="text-xs text-zinc-500">{p.note}</p>}
                          </div>
                          <p className="text-sm text-zinc-500">{formatDate(p.paymentDate)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            )}
          </DataState>
        )}
      </DataState>
    </>
  )
}
