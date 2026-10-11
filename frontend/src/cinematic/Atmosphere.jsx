import { useEffect, useRef } from 'react'
import { hasFinePointer } from './environment'

/**
 * Fixed atmosphere layers: animated film grain over everything, and a 600px ember spotlight that
 * follows the pointer (hardware-accelerated translate3d, no layout work).
 */
export function Atmosphere() {
  const spotlightRef = useRef(null)

  useEffect(() => {
    const spotlight = spotlightRef.current
    if (!spotlight || !hasFinePointer()) return undefined
    const half = 300
    const onMove = (event) => {
      spotlight.style.transform = `translate3d(${event.clientX - half}px, ${event.clientY - half}px, 0)`
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <>
      <div className="film-grain-overlay" aria-hidden="true" />
      <div ref={spotlightRef} className="spotlight" aria-hidden="true" />
    </>
  )
}
