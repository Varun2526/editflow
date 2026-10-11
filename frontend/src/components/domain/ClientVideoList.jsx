import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatDate } from '../../utils/format'
import { CONTENT_TYPE_LABEL } from '../../utils/labels'
import { DriveLink } from '../ui/DriveLink'
import { OverdueBadge, VideoStatusBadge } from '../ui/StatusBadges'

/** Portal video list: cards that work on phones; read-only (no workflow controls). */
export function ClientVideoList({ videos }) {
  return (
    <ul className="divide-y divide-zinc-100">
      {videos.map((video) => (
        <li key={video.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <Link to={`/portal/videos/${video.id}`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900">{video.title}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
              <span>{CONTENT_TYPE_LABEL[video.contentType]}</span>
              {video.deadline && <span className={video.overdue ? 'text-red-600' : ''}>Due {formatDate(video.deadline)}</span>}
              {video.revisionCount > 0 && <span>{video.revisionCount} revision{video.revisionCount === 1 ? '' : 's'}</span>}
            </p>
          </Link>
          <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            {video.overdue && <OverdueBadge />}
            <VideoStatusBadge status={video.status} />
            {video.driveUrl && <span className="hidden sm:inline"><DriveLink url={video.driveUrl} label="Drive" /></span>}
          </div>
          <ChevronRight className="size-4 shrink-0 text-zinc-300" />
        </li>
      ))}
    </ul>
  )
}
