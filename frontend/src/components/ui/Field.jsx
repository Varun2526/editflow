import { useId } from 'react'

const CONTROL = 'block w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm shadow-zinc-900/[0.02] transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 disabled:bg-zinc-50 disabled:text-zinc-500'
const NORMAL = 'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-900/10'
const INVALID = 'border-red-400 focus:border-red-500 focus:ring-red-500/15'

function FieldShell({ id, label, hint, error, optional, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-zinc-700">
          <span>{label}</span>
          {optional && <span className="text-xs font-normal text-zinc-400">Optional</span>}
        </label>
      )}
      {children}
      {error
        ? <p id={`${id}-error`} className="mt-1.5 animate-fade-up text-xs text-red-600">{error}</p>
        : hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

export function TextField({ label, hint, error, optional, className, ...props }) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${CONTROL} h-9 ${error ? INVALID : NORMAL}`}
        {...props}
      />
    </FieldShell>
  )
}

export function TextArea({ label, hint, error, optional, className, rows = 3, ...props }) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${CONTROL} py-2 ${error ? INVALID : NORMAL}`}
        {...props}
      />
    </FieldShell>
  )
}

export function SelectField({ label, hint, error, optional, className, children, ...props }) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${CONTROL} h-9 pr-8 ${error ? INVALID : NORMAL}`}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  )
}

export function FormError({ message }) {
  if (!message) return null
  return (
    <div role="alert" className="animate-fade-up rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
      {message}
    </div>
  )
}
