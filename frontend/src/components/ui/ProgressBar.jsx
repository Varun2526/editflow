import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '../../hooks/useMotion'

/** Progress value comes from the backend (progressPercent); this only draws it, easing in on mount. */
export function ProgressBar({ percent, size = 'md', className = '' }) {
  const value = Math.max(0, Math.min(100, Number(percent) || 0))
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0))

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(value))
    return () => cancelAnimationFrame(frame)
  }, [value])

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full overflow-hidden rounded-full bg-zinc-100 ${size === 'sm' ? 'h-1.5' : 'h-2'} ${className}`}
    >
      <div
        className="h-full rounded-full bg-zinc-800 transition-[width] duration-700 ease-out-expo"
        style={{ width: `${shown}%` }}
      />
    </div>
  )
}
