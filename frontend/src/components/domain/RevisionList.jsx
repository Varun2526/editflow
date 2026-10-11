import { CheckCircle2 } from 'lucide-react'
import { formatDateTime } from '../../utils/format'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/States'
import { RevisionStatusBadge } from '../ui/StatusBadges'

/** Revision history. onResolve is only passed in the admin app; clients never see the action. */
export function RevisionList({ revisions, onResolve, resolvingId }) {
  if (revisions.length === 0) {
    return <EmptyState compact title="No revisions yet" description="Timestamped feedback on this video will appear here." />
  }
  return (
    <ul className="divide-y divide-zinc-100">
      {revisions.map((revision) => (
        <li key={revision.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-4">
          <span className="w-fit rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-white tabular">{revision.timecode}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-800">{revision.comment}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {revision.requestedBy === 'CLIENT' ? 'Client' : 'Editor'} · {formatDateTime(revision.requestedAt)}
              {revision.resolvedAt && <> · Resolved {formatDateTime(revision.resolvedAt)}</>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RevisionStatusBadge status={revision.status} />
            {onResolve && revision.status === 'OPEN' && (
              <Button size="sm" variant="secondary" icon={CheckCircle2} loading={resolvingId === revision.id} onClick={() => onResolve(revision)}>
                Resolve
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
