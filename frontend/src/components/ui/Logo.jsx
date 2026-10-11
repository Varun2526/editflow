/** EditFlow mark: two offset clips on a timeline. */
export function Logo({ className = '', light = false }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${light ? 'text-white' : 'text-zinc-900'} ${className}`}>
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
        <rect x="2" y="5" width="12" height="5" rx="1.5" fill="currentColor" />
        <rect x="8" y="14" width="14" height="5" rx="1.5" fill="#E50914" />
      </svg>
      EditFlow
    </span>
  )
}
