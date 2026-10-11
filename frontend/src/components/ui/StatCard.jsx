import { Link } from 'react-router'
import { AnimatedNumber } from './AnimatedNumber'

/** Dashboard figure. Numeric values count up; `format` controls display (e.g. currency). */
export function StatCard({ label, value, format, hint, tone = 'default', to, children }) {
  // Figures stay neutral; red is reserved for genuine problems (tone 'danger').
  const valueColor = tone === 'danger' ? 'text-red-600' : 'text-zinc-900'
  const body = (
    <>
      <p className="text-[13px] font-medium text-zinc-500">{label}</p>
      <p className={`mt-2 font-display text-[28px] font-bold leading-none tracking-tight ${valueColor}`}>
        <AnimatedNumber value={value} format={format} />
      </p>
      {hint && <p className="mt-2 text-xs text-zinc-500">{hint}</p>}
      {children}
    </>
  )
  const classes = 'group relative block overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm shadow-zinc-900/[0.02]'
  return to ? (
    <Link
      to={to}
      className={`${classes} transition-[transform,box-shadow,border-color] duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-900/[0.06]`}
    >
      {/* Soft corner glow on hover, adapted from the portfolio's bento cards. */}
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-zinc-200/60 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  )
}
