const TONES = {
  neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  yellow: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  dark: 'bg-zinc-900 text-white ring-zinc-900',
  red: 'bg-red-50 text-red-700 ring-red-200',
  accent: 'bg-accent-50 text-accent-700 ring-accent-200',
}

/** Pass `animateKey` (e.g. the status) to replay a small pop whenever it changes. */
export function Badge({ tone = 'neutral', dot = false, animateKey, children, className = '' }) {
  return (
    <span
      key={animateKey}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]} ${animateKey ? 'animate-pop' : ''} ${className}`}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  )
}
