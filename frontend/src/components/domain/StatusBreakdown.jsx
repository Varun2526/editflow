import { VIDEO_STATUSES, VIDEO_STATUS_LABEL } from '../../utils/labels'

const COLORS = {
  PENDING: 'bg-zinc-300', MEDIA_RECEIVED: 'bg-sky-400', EDITING: 'bg-yellow-400',
  REVIEW: 'bg-violet-400', COMPLETED: 'bg-emerald-500', DELIVERED: 'bg-zinc-900',
}

/** Stacked bar + legend of backend VideoStats.byStatus counts. */
export function StatusBreakdown({ stats }) {
  const total = stats.total || 0
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-100" aria-hidden="true">
        {total > 0 && VIDEO_STATUSES.map((status) => stats.byStatus[status] > 0 && (
          <div key={status} className={COLORS[status]} style={{ width: `${(stats.byStatus[status] / total) * 100}%` }} />
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {VIDEO_STATUSES.map((status) => (
          <div key={status} className="flex items-center gap-1.5 text-xs">
            <span className={`size-2 rounded-full ${COLORS[status]}`} />
            <dt className="truncate text-zinc-500">{VIDEO_STATUS_LABEL[status]}</dt>
            <dd className="ml-auto font-medium tabular text-zinc-900">{stats.byStatus[status]}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
