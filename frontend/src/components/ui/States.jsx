import { AlertTriangle, Loader2, Lock, RefreshCw, SearchX } from 'lucide-react'
import { Button } from './Button'

export function Spinner({ label = 'Loading' }) {
  return (
    <div role="status" className="flex animate-fade-in items-center justify-center gap-2 py-16 text-sm text-zinc-500">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

function StateIcon({ icon: Icon, tone }) {
  const tones = tone === 'danger' ? 'bg-red-50 text-red-600 ring-red-100' : 'bg-zinc-50 text-zinc-500 ring-zinc-100'
  return (
    <div className={`mb-4 flex size-12 animate-pop items-center justify-center rounded-2xl ring-8 ${tones}`}>
      <Icon className="size-5" />
    </div>
  )
}

export function EmptyState({ icon, title, description, action, compact = false }) {
  return (
    <div className={`flex animate-fade-up flex-col items-center justify-center px-6 text-center ${compact ? 'py-8' : 'py-14'}`}>
      {icon && <StateIcon icon={icon} />}
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  const forbidden = error?.status === 403
  const notFound = error?.status === 404
  const icon = forbidden ? Lock : notFound ? SearchX : AlertTriangle
  const title = forbidden ? 'No access' : notFound ? 'Not found' : "Couldn't load this"
  return (
    <div role="alert" className="flex animate-fade-up flex-col items-center justify-center px-6 py-14 text-center">
      <StateIcon icon={icon} tone="danger" />
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{error?.message}</p>
      {onRetry && !forbidden && !notFound && (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry} className="mt-5">Try again</Button>
      )}
    </div>
  )
}

/**
 * Renders loading → error → empty → content for a useApi() result. While re-fetching after a
 * mutation the previous data stays on screen.
 */
export function DataState({ state, isEmpty, empty, loading, children }) {
  if (state.data === undefined) {
    if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />
    return loading ?? <Spinner />
  }
  if (isEmpty?.(state.data)) return empty
  return children(state.data)
}
