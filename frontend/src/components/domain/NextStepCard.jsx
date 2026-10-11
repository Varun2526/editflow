import { ArrowRight, CheckCircle2, Clock } from 'lucide-react'

/**
 * The one thing to do next: what's happening, the action, and what happens after it.
 * owner: 'admin' (your turn) | 'client' (waiting on the other side) | 'done'.
 */
export function NextStepCard({ step, onAction, actionLoading = false, audience = 'admin' }) {
  if (!step) return null
  const yourTurn = step.owner === (audience === 'admin' ? 'admin' : 'client')
  const done = step.owner === 'done'
  const Icon = done ? CheckCircle2 : yourTurn ? ArrowRight : Clock
  const label = done ? 'All caught up' : yourTurn ? 'Next step' : audience === 'admin' ? 'Waiting on the client' : 'With your editor'

  return (
    <section
      aria-label={label}
      className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 ${
        yourTurn ? 'border-zinc-300 bg-gradient-to-br from-zinc-50 via-white to-white shadow-sm shadow-zinc-900/[0.03]' : 'border-zinc-200/80 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
            yourTurn ? 'bg-zinc-900 text-white' : done ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'
          }`}
          >
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className={`eyebrow ${yourTurn ? 'text-zinc-900' : 'text-zinc-500'}`}>{label}</p>
            <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-zinc-900">{step.title}</h2>
            {step.detail && <p className="mt-1 text-sm text-zinc-600">{step.detail}</p>}
            {step.after && step.action && <p className="mt-1.5 text-xs text-zinc-500">Then: {step.after}</p>}
          </div>
        </div>
        {step.action && onAction && (
          <button
            type="button"
            onClick={onAction}
            disabled={actionLoading}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-[background-color,transform] duration-200 ease-out-expo active:scale-[0.97] disabled:opacity-60 ${
              yourTurn ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50'
            }`}
          >
            {step.action.label}
            <ArrowRight className="size-4" />
          </button>
        )}
      </div>
    </section>
  )
}
