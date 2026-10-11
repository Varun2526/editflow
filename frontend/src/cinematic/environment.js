/** Capability checks for the cinematic layer, evaluated once per call (cheap). */
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

export function hasFinePointer() {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches === true
}

/** Phones/tablets: lower resolution and frame rate for the WebGL field. */
export function isConstrainedDevice() {
  if (typeof window === 'undefined') return true
  return window.matchMedia?.('(pointer: coarse)').matches === true || window.innerWidth < 768
}
