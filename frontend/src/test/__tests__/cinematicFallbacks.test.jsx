import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WaveBackground } from '../../cinematic/WaveBackground'
import { Cursor } from '../../cinematic/Cursor'
import { startLenis, stopLenis } from '../../cinematic/lenis'

const realMatchMedia = window.matchMedia

function mockMedia(matching) {
  window.matchMedia = (query) => ({
    matches: matching.some((m) => query.includes(m)), media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  })
}

describe('cinematic layer fallbacks', () => {
  afterEach(() => {
    window.matchMedia = realMatchMedia
    stopLenis()
    vi.restoreAllMocks()
  })

  it('shows the static ember fallback when WebGL is unavailable (no Three.js loaded)', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { container } = render(<WaveBackground />)

    expect(container.querySelector('canvas')).toBeNull()
    expect(container.querySelector('[style*="radial-gradient"]')).not.toBeNull()
  })

  it('does not render the custom pointer for touch / coarse pointers', () => {
    mockMedia(['pointer: coarse'])
    const { container } = render(<Cursor />)

    expect(container.querySelector('.cursor-ring')).toBeNull()
    expect(document.documentElement.classList.contains('has-custom-cursor')).toBe(false)
  })

  it('does not render the custom pointer when the user prefers reduced motion', () => {
    mockMedia(['pointer: fine', 'prefers-reduced-motion'])
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true })
    const { container } = render(<Cursor />)

    expect(container.querySelector('.cursor-ring')).toBeNull()
  })

  it('keeps native scrolling (no Lenis) for reduced motion', () => {
    mockMedia(['prefers-reduced-motion'])
    globalThis.ResizeObserver ??= class { observe() {} disconnect() {} }

    expect(startLenis()).toBeNull()
    expect(document.documentElement.classList.contains('lenis')).toBe(false)
  })
})
