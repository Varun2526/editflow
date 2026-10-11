import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Logo } from '../components/ui/Logo'
import { buttonClasses } from '../components/ui/buttonClasses'
import { Atmosphere } from '../cinematic/Atmosphere'
import { Cursor } from '../cinematic/Cursor'
import { ScrollTrigger } from '../cinematic/gsap'
import { scrollToTop, startLenis, stopLenis } from '../cinematic/lenis'
import { warmUpServer } from '../api/serverStatus'

const YEAR = new Date().getFullYear()
const EASE = [0.16, 1, 0.3, 1]

/** Navbar: drops in on load, then morphs into a floating blurred pill once the page scrolls. */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        top: scrolled ? 14 : 0,
        width: scrolled ? 'min(860px, calc(100% - 24px))' : '100%',
        borderRadius: scrolled ? 9999 : 0,
        backgroundColor: scrolled ? 'rgba(14, 14, 16, 0.72)' : 'rgba(9, 9, 11, 0)',
        borderColor: scrolled ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0)',
        backdropFilter: scrolled ? 'blur(16px)' : 'blur(0px)',
      }}
      transition={{
        y: { duration: 0.9, ease: EASE, delay: 0.1 },
        opacity: { duration: 0.3 },
        default: { duration: 0.45, ease: EASE },
      }}
      className="fixed z-50 border"
      style={{ x: '-50%', left: '50%' }}
    >
      <div className={`mx-auto flex max-w-6xl items-center justify-between transition-[padding] duration-500 ${scrolled ? 'px-5 py-2.5' : 'px-4 py-5 sm:px-6'}`}>
        <Link to="/" aria-label="EditFlow home"><Logo light /></Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/work-with-me" className="nav-link whitespace-nowrap text-sm">Work with me</Link>
          <Link to="/login" className={buttonClasses({ variant: 'outlineDark', size: 'sm' })}>Sign in</Link>
        </div>
      </div>
    </motion.nav>
  )
}

/**
 * Public site shell: cinematic black environment (grain, spotlight, custom pointer), Lenis
 * smooth scrolling synced to ScrollTrigger, navbar morph and cross-fading route transitions.
 */
export function PublicLayout() {
  const location = useLocation()

  useEffect(() => {
    warmUpServer()
    startLenis()
    return () => stopLenis()
  }, [])

  useEffect(() => {
    scrollToTop()
    const timer = setTimeout(() => ScrollTrigger.refresh(), 150)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div className="min-h-screen overflow-x-clip bg-[#09090b] text-[#f5f5f7]">
      <Atmosphere />
      <Cursor />
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.5, ease: EASE } }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <footer className="relative z-10 border-t border-white/[0.08]">
        <div className="overflow-hidden border-b border-white/[0.06] py-6" aria-hidden="true">
          <div className="marquee-track flex w-max gap-10 whitespace-nowrap font-display text-5xl font-extrabold tracking-tight text-white/[0.06] sm:text-7xl">
            {[0, 1].map((copy) => (
              <span key={copy} className="flex gap-10">
                {['Reels', 'YouTube Shorts', 'YouTube videos', 'Podcasts', 'Revisions', 'Delivered on time'].map((word) => (
                  <span key={word} className="flex items-center gap-10">{word}<span className="text-accent-500/40">✦</span></span>
                ))}
              </span>
            ))}
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-8 text-sm text-[#8e8e93] sm:px-6">
          <span>© {YEAR} EditFlow · Video editing for creators and brands</span>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/work-with-me" className="transition-colors hover:text-white">Work with me</Link>
            <Link to="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
            <Link to="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link to="/login" className="transition-colors hover:text-white">Client sign in</Link>
          </nav>
        </div>
        {/* Maker's mark: invisible until someone selects (click-drags over) the very bottom of the page. */}
        <p data-credit className="pb-6 text-center text-xs text-transparent selection:bg-accent-500 selection:text-white">
          Built by Varun Koppula
        </p>
      </footer>
    </div>
  )
}
