import { Link, useNavigate } from 'react-router'
import { formatMoney, formatPeriod } from '../../utils/format'
import { ProgressBar } from '../ui/ProgressBar'
import { PaymentStatusBadge, ProjectStatusBadge } from '../ui/StatusBadges'
import { Table, Td, Th, Tr } from '../ui/Table'

/** Admin project rows; every figure is from the backend's ProjectResponse. */
export function ProjectTable({ projects, showClient = true }) {
  const navigate = useNavigate()
  return (
    <Table>
      <thead>
        <tr>
          <Th>Project</Th><Th>Period</Th><Th>Progress</Th><Th align="right">Fee</Th><Th align="right">Paid</Th>
          <Th align="right">Balance</Th><Th>Payment</Th><Th>Status</Th>
        </tr>
      </thead>
      <tbody>
        {projects.map((p) => (
          <Tr key={p.id} onClick={() => navigate(`/admin/projects/${p.id}`)}>
            <Td>
              <Link to={`/admin/projects/${p.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-zinc-900 hover:text-zinc-500">{p.name}</Link>
              {showClient && <p className="text-xs text-zinc-500">{p.clientName}</p>}
            </Td>
            <Td className="whitespace-nowrap">{formatPeriod(p.month, p.year)}</Td>
            <Td className="min-w-36">
              <div className="flex items-center gap-2">
                <ProgressBar percent={p.videos.progressPercent} size="sm" />
                <span className="whitespace-nowrap text-xs text-zinc-500 tabular">{p.videos.done}/{p.videos.total}</span>
              </div>
            </Td>
            <Td align="right">{formatMoney(p.payment.totalFee)}</Td>
            <Td align="right">{formatMoney(p.payment.totalPaid)}</Td>
            <Td align="right">{formatMoney(p.payment.balance)}</Td>
            <Td><PaymentStatusBadge status={p.payment.status} /></Td>
            <Td><ProjectStatusBadge status={p.status} /></Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}
