import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router'

export function PageHeader({ title, description, actions, back, meta, eyebrow }) {
  return (
    <div className="mb-7">
      {back && (
        <Link to={back.to} className="group mb-3 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900">
          <ChevronLeft className="size-4 transition-transform duration-300 ease-out-expo group-hover:-translate-x-0.5" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1.5 text-zinc-500">{eyebrow}</p>}
          <h1 className="truncate font-display text-2xl font-bold tracking-tight text-zinc-900 sm:text-[28px]">{title}</h1>
          {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
          {meta && <div className="mt-2.5 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
