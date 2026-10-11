/**
 * GSAP setup for the public site: plugins registered once, slow confident defaults and the
 * "cinematic" ease (0.16, 1, 0.3, 1) used by every reveal. Reduced motion speeds the global
 * timeline up so animations complete instantly.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP)
gsap.defaults({ ease: 'power3.out', duration: 1.0 })
CustomEase.create('cinematic', '0.16, 1, 0.3, 1')

gsap.matchMedia().add('(prefers-reduced-motion: reduce)', () => {
  gsap.globalTimeline.timeScale(100)
})

export { gsap, ScrollTrigger, SplitText, useGSAP }
