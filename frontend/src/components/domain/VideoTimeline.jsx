import { Check } from 'lucide-react'
import { formatDateTime } from '../../utils/format'
import { VIDEO_STATUSES, VIDEO_STATUS_LABEL } from '../../utils/labels'

const STAMPS = { MEDIA_RECEIVED: 'mediaReceivedAt', COMPLETED: 'editCompletedAt', DELIVERED: 'deliveredAt' }

/** Read-only picture of where a video is in the workflow, with the backend's stage timestamps. */
export function VideoTimeline({ video }) {
  const currentIndex = VIDEO_STATUSES.indexOf(video.status)
  return (
    <ol className="grid grid-cols-3 gap-y-5 sm:grid-cols-6">
      {VIDEO_STATUSES.map((status, index) => {
        const done = index < currentIndex
        const current = index === currentIndex
        const stamp = STAMPS[status] && video[STAMPS[status]]
        return (
          <li key={status} className="relative flex flex-col items-start pr-2">
            {index < VIDEO_STATUSES.length - 1 && (
              <span className="absolute left-6 right-0 top-3 hidden h-px overflow-hidden bg-zinc-200 sm:block">
                <span className={`block h-full origin-left bg-zinc-900 transition-transform duration-500 ease-out-expo ${done ? 'scale-x-100' : 'scale-x-0'}`} />
              </span>
            )}
            <span
              aria-current={current ? 'step' : undefined}
              className={`relative z-10 flex size-6 items-center justify-center rounded-full text-[11px] font-semibold transition-[background-color,color,box-shadow] duration-300 ease-out-expo ${
                done ? 'bg-zinc-900 text-white' : current ? 'bg-white text-zinc-900 ring-2 ring-zinc-900' : 'bg-white text-zinc-400 ring-1 ring-zinc-200'
              }`}
            >
              {done ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span className={`mt-2 text-xs font-medium ${current ? 'text-zinc-900' : done ? 'text-zinc-700' : 'text-zinc-400'}`}>
              {VIDEO_STATUS_LABEL[status]}
            </span>
            {stamp && <span className="mt-0.5 text-[11px] text-zinc-500">{formatDateTime(stamp)}</span>}
            {status === 'COMPLETED' && video.approvedAt && <span className="mt-0.5 text-[11px] font-medium text-emerald-700">Approved by client</span>}
          </li>
        )
      })}
    </ol>
  )
}
