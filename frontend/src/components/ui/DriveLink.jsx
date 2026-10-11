import { ExternalLink } from 'lucide-react'

/** Opens the stored Google Drive URL in a new tab. Media never passes through EditFlow. */
export function DriveLink({ url, label = 'Open Drive' }) {
  if (!url) return <span className="text-xs text-zinc-400">No link</span>
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="inline-flex items-center gap-1 text-[13px] font-medium text-zinc-700 underline-offset-2 hover:text-zinc-500 hover:underline"
    >
      {label}
      <ExternalLink className="size-3.5" />
    </a>
  )
}
