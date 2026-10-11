import Lenis from 'lenis'
import { ScrollTrigger } from './gsap'
import { prefersReducedMotion } from './environment'

let lenis = null
let frame = null

/**
 * Smooth scrolling (lerp 0.09, trackpad/touch unified) with ScrollTrigger updated inside the
 * same frame, so scrubbed animations never lag a frame behind the scroll position.
 * Not started for reduced-motion users.
 */
export function startLenis() {
  // Older browsers / test DOMs without ResizeObserver keep native scrolling.
  if (lenis || prefersReducedMotion() || typeof ResizeObserver === 'undefined') return lenis
  lenis = new Lenis({ lerp: 0.09, orientation: 'vertical', gestureOrientation: 'vertical', smoothWheel: true, syncTouch: true })
  const update = (time) => {
    lenis?.raf(time)
    ScrollTrigger.update()
    frame = requestAnimationFrame(update)
  }
  frame = requestAnimationFrame(update)
  return lenis
}

export function stopLenis() {
  if (frame) cancelAnimationFrame(frame)
  frame = null
  lenis?.destroy()
  lenis = null
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true })
  window.scrollTo(0, 0)
}
