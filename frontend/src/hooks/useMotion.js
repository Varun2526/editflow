import { useEffect, useRef, useState } from 'react'

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))

/**
 * Counts from the previous value to `target` (from 0 on first render). The final frame is
 * always exactly `target`, so displayed figures are never rounded versions of backend values.
 */
export function useCountUp(target, duration = 700) {
  const animate = !prefersReducedMotion() && typeof requestAnimationFrame !== 'undefined'
  const [value, setValue] = useState(animate ? 0 : target)
  const fromRef = useRef(animate ? 0 : target)

  useEffect(() => {
    if (!animate) {
      fromRef.current = target
      return undefined
    }
    const from = fromRef.current
    const start = performance.now()
    let frame
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      setValue(progress >= 1 ? target : from + (target - from) * easeOutExpo(progress))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, animate])

  return animate ? value : target
}

/** True once the element has scrolled into view (stays true). Used for public-page reveals only. */
export function useReveal(options = { rootMargin: '0px 0px -10% 0px' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined' || prefersReducedMotion())

  useEffect(() => {
    if (visible || !ref.current) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        observer.disconnect()
      }
    }, options)
    observer.observe(ref.current)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  return [ref, visible]
}

/**
 * Keeps an element mounted for `duration` ms after `open` turns false, so it can play an exit
 * animation. Returns { mounted, closing }.
 */
export function usePresence(open, duration = 180) {
  const [state, setState] = useState({ mounted: open, closing: false })

  useEffect(() => {
    if (open) {
      setState({ mounted: true, closing: false })
      return undefined
    }
    if (!state.mounted) return undefined
    if (prefersReducedMotion()) {
      setState({ mounted: false, closing: false })
      return undefined
    }
    setState({ mounted: true, closing: true })
    const timer = setTimeout(() => setState({ mounted: false, closing: false }), duration)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return state
}
