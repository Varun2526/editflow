/**
 * Panel. `interactive` adds the hover lift (only for cards that are clickable, so motion always
 * signals "you can open this").
 */
export function Card({ children, className = '', interactive = false }) {
  return (
    <section
      className={`rounded-2xl border border-zinc-200/80 bg-white shadow-sm shadow-zinc-900/[0.02] ${
        interactive ? 'transition-[transform,box-shadow,border-color] duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-900/[0.06]' : ''
      } ${className}`}
    >
      {children}
    </section>
  )
}

export function CardHeader({ title, description, action, className = '' }) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}
