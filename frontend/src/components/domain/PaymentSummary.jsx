import { formatMoney } from '../../utils/format'
import { PaymentStatusBadge } from '../ui/StatusBadges'

/** Displays the backend's PaymentSummary (fee, paid, balance, status) without recalculating it. */
export function PaymentSummary({ summary }) {
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div>
        <dt className="text-xs text-zinc-500">Project fee</dt>
        <dd className="mt-1 font-display text-xl font-bold tracking-tight">{formatMoney(summary.totalFee)}</dd>
      </div>
      <div>
        <dt className="text-xs text-zinc-500">Paid</dt>
        <dd className="mt-1 font-display text-xl font-bold tracking-tight text-emerald-700">{formatMoney(summary.totalPaid)}</dd>
      </div>
      <div>
        <dt className="text-xs text-zinc-500">Remaining</dt>
        <dd className={`mt-1 font-display text-xl font-bold tracking-tight ${Number(summary.balance) > 0 ? 'text-zinc-900' : 'text-zinc-400'}`}>
          {formatMoney(summary.balance)}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-zinc-500">Status</dt>
        <dd className="mt-1.5"><PaymentStatusBadge status={summary.status} /></dd>
      </div>
    </dl>
  )
}
