import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { hasFinePointer, prefersReducedMotion } from './environment'

const INTERACTIVE = 'a, button, [role="tab"], [data-cursor], .bento-card'
const TEXT_ENTRY = 'input, textarea, select, [contenteditable="true"]'
const EMBER = 'rgba(255, 51, 75, 0.75)'
const EMBER_SOFT = 'rgba(255, 51, 75, 0.35)'

/**
 * Two-part pointer: a ring that trails with inertia (0.45s) and a glowing symbol that tracks
 * almost instantly (0.08s). Grows over interactive elements, shrinks on press, steps aside over
 * text fields. Desktop only; touch devices and small screens keep the native pointer.
 */
export function Cursor() {
  const [enabled] = useState(() => hasFinePointer() && window.innerWidth > 768 && !('ontouchstart' in window))
  const ringRef = useRef(null)
  const symbolRef = useRef(null)

  useEffect(() => {
    const ring = ringRef.current
    const symbol = symbolRef.current
    if (!enabled || !ring || !symbol) return undefined
    document.documentElement.classList.add('has-custom-cursor')

    const xRing = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' })
    const yRing = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' })
    const xSymbol = gsap.quickTo(symbol, 'x', { duration: 0.08, ease: 'power3.out' })
    const ySymbol = gsap.quickTo(symbol, 'y', { duration: 0.08, ease: 'power3.out' })

    const onMove = (event) => {
      xRing(event.clientX)
      yRing(event.clientY)
      xSymbol(event.clientX)
      ySymbol(event.clientY)
      gsap.to([ring, symbol], { autoAlpha: 1, duration: 0.3, overwrite: 'auto' })
    }
    const onOver = (event) => {
      const target = event.target
      if (target.closest?.(TEXT_ENTRY)) {
        gsap.to([ring, symbol], { scale: 0, opacity: 0, duration: 0.2, ease: 'power2.out' })
        return
      }
      if (target.closest?.(INTERACTIVE)) {
        gsap.to(ring, { scale: 1.4, opacity: 0.9, borderColor: EMBER, duration: 0.25, ease: 'power2.out' })
        gsap.to(symbol, { scale: 1.25, color: '#ff334b', duration: 0.25, ease: 'power2.out' })
      } else {
        gsap.to(ring, { scale: 1, opacity: 0.65, borderColor: EMBER_SOFT, duration: 0.25, ease: 'power2.out' })
        gsap.to(symbol, { scale: 1, opacity: 1, color: '#ffffff', duration: 0.25, ease: 'power2.out' })
      }
    }
    const onDown = () => {
      gsap.to(symbol, { scale: 0.85, duration: 0.12, ease: 'power2.out' })
      gsap.to(ring, { scale: 0.8, duration: 0.12, ease: 'power2.out' })
    }
    const onUp = () => {
      gsap.to(symbol, { scale: 1, duration: 0.15, ease: 'power2.out' })
      gsap.to(ring, { scale: 1, duration: 0.15, ease: 'power2.out' })
    }
    const onLeave = () => gsap.to([ring, symbol], { autoAlpha: 0, duration: 0.3 })

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver, { passive: true })
    window.addEventListener('mousedown', onDown, { passive: true })
    window.addEventListener('mouseup', onUp, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      gsap.killTweensOf([ring, symbol])
    }
  }, [enabled])

  if (!enabled || prefersReducedMotion()) return null
  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={symbolRef} className="cursor-symbol" aria-hidden="true">
        {/* EditFlow mark: two offset clips on a timeline */}
        <svg viewBox="0 0 24 24" width="18" height="18">
          <rect x="2" y="5" width="12" height="5" rx="1.5" fill="currentColor" />
          <rect x="8" y="14" width="14" height="5" rx="1.5" fill="#E50914" />
        </svg>
      </div>
    </>
  )
}
