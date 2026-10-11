import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './environment'

// Three.js + the shader load only when a wave is actually shown (never in the workspace bundle).
const ColorBends = lazy(() => import('./ColorBends'))

/** The reference portfolio's three reds (ColorBends blends them additively). */
const WAVE_COLORS = ['#E50914', '#FF334B', '#991B1B']

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

/** Static ember light, used while the wave loads and whenever WebGL is unavailable. */
export function WaveFallback() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(50% 40% at 50% 45%, rgba(255, 51, 75,0.28), transparent 70%),' +
          'radial-gradient(70% 55% at 50% 50%, rgba(153, 27, 27,0.35), transparent 75%), #09090b',
      }}
    />
  )
}

/**
 * The interactive ColorBends wave. Mounted the first time its container comes into view and then
 * kept: off screen, ColorBends pauses its own render loop (zero GPU work) instead of tearing the
 * WebGL context down and rebuilding it on every scroll back. Reduced motion: frozen wave.
 */
export function WaveBackground({ intensity = 1.5, ...props }) {
  const ref = useRef(null)
  // Without IntersectionObserver (very old browsers) the wave simply shows immediately.
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined')
  const [supported] = useState(webglAvailable)
  const [still] = useState(prefersReducedMotion)

  useEffect(() => {
    if (!ref.current || shown) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShown(true)
        observer.disconnect()
      }
    }, { threshold: 0.01 })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [shown])

  return (
    <div ref={ref} className="absolute inset-0" aria-hidden="true">
      {supported && shown ? (
        <Suspense fallback={<WaveFallback />}>
          <ColorBends
            rotation={90}
            speed={still ? 0 : 0.2}
            colors={WAVE_COLORS}
            transparent
            autoRotate={still ? 0 : 1}
            scale={0.6}
            frequency={1.6}
            warpStrength={1}
            mouseInfluence={still ? 0 : 1.6}
            parallax={still ? 0 : 0.5}
            noise={0.2}
            iterations={1}
            intensity={intensity}
            bandWidth={6}
            {...props}
          />
        </Suspense>
      ) : (
        <WaveFallback />
      )}
    </div>
  )
}
