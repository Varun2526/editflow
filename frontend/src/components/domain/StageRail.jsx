import { VIDEO_STATUSES, VIDEO_STATUS_LABEL } from '../../utils/labels'

/**
 * Where every video in the project is right now: the six workflow stages with live counts.
 * Clicking a stage filters the list below; clicking it again clears the filter.
 */
export function StageRail({ counts, active, onSelect }) {
  const total = VIDEO_STATUSES.reduce((sum, status) => sum + (counts[status] ?? 0), 0)
  return (
    <ol className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-200/80 sm:grid-cols-6" aria-label="Videos by stage">
      {VIDEO_STATUSES.map((status, index) => {
        const count = counts[status] ?? 0
        const selected = active === status
        return (
          <li key={status} className="bg-white">
            <button
              type="button"
              onClick={() => onSelect(selected ? null : status)}
              aria-pressed={selected}
              disabled={total === 0}
              className={`group flex h-full w-full flex-col items-start px-3 py-2.5 text-left transition-colors ${
                selected ? 'bg-zinc-900 text-white' : count > 0 ? 'hover:bg-zinc-50' : ''
              }`}
            >
              <span className={`text-[11px] font-medium ${selected ? 'text-zinc-300' : 'text-zinc-400'}`}>{index + 1}. {VIDEO_STATUS_LABEL[status]}</span>
              <span className={`mt-0.5 font-display text-xl font-bold tabular ${selected ? 'text-white' : count > 0 ? 'text-zinc-900' : 'text-zinc-300'}`}>{count}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
