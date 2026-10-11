import { useCountUp } from '../../hooks/useMotion'

/**
 * Counts up to a backend value. Intermediate frames are formatted as whole numbers; the final
 * frame shows the exact value, formatted by `format`.
 */
export function AnimatedNumber({ value, format = (n) => String(n), duration }) {
  const target = Number(value) || 0
  const current = useCountUp(target, duration)
  return <span className="tabular">{format(current === target ? target : Math.round(current))}</span>
}
