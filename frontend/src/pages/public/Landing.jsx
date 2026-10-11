import { useRef } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { buttonClasses } from '../../components/ui/buttonClasses'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../../cinematic/gsap'
import { WaveBackground } from '../../cinematic/WaveBackground'
import { VIDEO_STATUSES, VIDEO_STATUS_LABEL } from '../../utils/labels'

const SERVICES = [
  { title: 'Reels', text: 'Hook-first vertical edits built for retention: pacing, captions and sound design.' },
  { title: 'YouTube Shorts', text: 'Punchy cut-downs from long-form footage, tuned for the Shorts feed.' },
  { title: 'YouTube videos', text: 'Long-form storytelling with structure, b-roll, graphics and clean audio.' },
  { title: 'Podcasts', text: 'Multi-camera podcast edits plus clip-ready highlights for every episode.' },
]

const PROCESS = [
  { title: 'Share your footage', text: 'Upload raw media to Google Drive. Heavy files never pass through this site.' },
  { title: 'Editing and review', text: 'Every video has a clear status, from media received to delivered, in your portal.' },
  { title: 'Timestamped revisions', text: 'Leave feedback like “00:17 — make this transition faster” right on the video.' },
  { title: 'Delivered on schedule', text: 'Deadlines, delivery links and payments in one place instead of scattered chats.' },
]

const STAGE_NOTES = {
  PENDING: 'Planned for the month',
  MEDIA_RECEIVED: 'Raw footage is in Drive',
  EDITING: 'Cutting, pacing, sound',
  REVIEW: 'Your turn: timestamped notes',
  COMPLETED: 'Final cut approved',
  DELIVERED: 'Ready to publish',
}

function Hero() {
  const scope = useRef(null)

  useGSAP(() => {
    gsap.set('.hero-heading', { autoAlpha: 0, scale: 0.95, y: 15 })
    gsap.set('.hero-sub', { autoAlpha: 0, y: 15 })
    gsap.set('.hero-cta', { autoAlpha: 0, y: 15 })
    gsap.set('.scroll-hint', { autoAlpha: 0 })
    const tl = gsap.timeline({ delay: 0.2 })
    tl.to('.hero-heading', { autoAlpha: 1, scale: 1, y: 0, duration: 1.2, ease: 'cinematic' })
      .to('.hero-sub', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .to('.hero-cta', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.55')
      .to('.scroll-hint', { autoAlpha: 1, duration: 0.6, ease: 'power2.out' }, '-=0.3')
    gsap.to('.scroll-arrow', { y: 8, repeat: -1, yoyo: true, duration: 1.2, ease: 'power2.inOut', delay: 1.5 })
  }, { scope })

  return (
    <section ref={scope} className="relative flex h-[100svh] min-h-[620px] items-center justify-center overflow-hidden bg-[#09090b]" aria-label="Hero">
      <WaveBackground />
      <div className="vignette" aria-hidden="true" />
      <div className="relative z-[3] px-6 text-center">
        <p className="hero-sub eyebrow mb-6 text-accent-400">Video editing for creators &amp; brands</p>
        <h1 className="hero-heading mx-auto max-w-5xl font-display text-[clamp(3rem,9vw,8rem)] font-extrabold leading-[0.92] tracking-[-0.03em] text-white">
          Edits that keep your audience <span className="text-accent-400">watching.</span>
        </h1>
        <p className="hero-sub mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[#8e8e93]">
          Monthly editing for reels, Shorts, YouTube and podcasts, with a private client portal.
        </p>
        <div className="hero-cta mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/work-with-me" className={buttonClasses({ variant: 'accent', size: 'lg', className: 'group' })}>
            Work with me <ArrowRight className="size-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" />
          </Link>
          <Link to="/login" className={buttonClasses({ variant: 'outlineDark', size: 'lg' })}>Client sign in</Link>
        </div>
      </div>
      <div className="scroll-hint absolute bottom-10 left-1/2 z-[3] flex -translate-x-1/2 flex-col items-center gap-2.5" aria-hidden="true">
        <span className="eyebrow text-white/35">Scroll</span>
        <div className="scroll-arrow">
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <path d="M8 0V20M8 20L2 14M8 20L14 14" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </section>
  )
}

/** Statement whose words illuminate one by one, scrubbed by scroll. */
function Statement() {
  const scope = useRef(null)
  useGSAP(() => {
    const split = SplitText.create('.statement', { type: 'words', wordsClass: 'statement-word' })
    gsap.set(split.words, { opacity: 0.2, filter: 'blur(2px)' })
    gsap.to(split.words, {
      opacity: 1,
      filter: 'blur(0px)',
      stagger: { each: 0.06, from: 'start' },
      ease: 'power2.out',
      scrollTrigger: { trigger: scope.current, start: 'top 75%', end: 'center 40%', scrub: 0.8 },
    })
    gsap.fromTo('.statement-note', { opacity: 0.4, y: 15 }, {
      opacity: 1, y: 0, ease: 'power2.out',
      scrollTrigger: { trigger: '.statement-note', start: 'top 85%', end: 'top 55%', scrub: 0.8 },
    })
    return () => split.revert()
  }, { scope })

  return (
    <section ref={scope} className="relative z-10 mx-auto max-w-6xl px-4 py-32 sm:px-6 sm:py-44">
      <p className="eyebrow mb-8 text-accent-400">About the work</p>
      <p className="statement font-display text-[clamp(1.9rem,4.4vw,4rem)] font-bold leading-[1.12] tracking-[-0.02em] text-white">
        Every month, your raw footage becomes scroll-stopping reels, Shorts, long-form videos and podcasts — tracked from the first upload to final delivery.
      </p>
      <p className="statement-note mt-10 max-w-xl text-lg leading-relaxed text-[#8e8e93]">
        No more chasing status updates on WhatsApp or digging through Drive folders. Your portal shows each video, every revision and what&apos;s been paid.
      </p>
    </section>
  )
}

/** Pinned showcase: the frame expands to full screen, holds while the workflow lights up, then settles. */
function WorkflowShowcase() {
  const track = useRef(null)
  const sticky = useRef(null)
  const frame = useRef(null)

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 769px)', () => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: track.current, start: 'top top', end: 'bottom bottom', scrub: 0.8, pin: sticky.current, anticipatePin: 1 },
      })
      tl.to(frame.current, { width: '100vw', height: '100vh', borderRadius: '0px', maxWidth: '100vw', ease: 'power2.out', duration: 1.0 }, 0)
        .fromTo('.stage', { opacity: 0.18, y: 18 }, { opacity: 1, y: 0, stagger: 0.35, duration: 0.5, ease: 'power2.out' }, 0.9)
        .fromTo('.stage-line-fill', { scaleX: 0 }, { scaleX: 1, duration: 2.2, ease: 'none' }, 0.9)
        .to({}, { duration: 0.6 })
        .to(frame.current, { width: '84vw', height: '66vh', borderRadius: '16px', maxWidth: '1440px', ease: 'power2.inOut', duration: 1.2 })
    })
    mm.add('(max-width: 768px)', () => {
      gsap.fromTo('.stage', { opacity: 0.25, y: 16 }, {
        opacity: 1, y: 0, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: frame.current, start: 'top 75%', end: 'bottom 60%', scrub: 0.8 },
      })
    })
  }, { scope: track })

  return (
    <section ref={track} className="relative z-10 md:h-[320vh]" aria-label="How a video moves through EditFlow">
      <div ref={sticky} className="flex min-h-[100svh] items-center justify-center overflow-hidden px-4 py-16 md:h-screen md:px-0 md:py-0">
        <div
          ref={frame}
          className="relative flex w-full flex-col justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d10] px-6 py-12 md:h-[66vh] md:w-[84vw] md:max-w-[1440px] md:px-14"
        >
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-[520px] rounded-full bg-accent-600/20 blur-[120px]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 size-[420px] rounded-full bg-[#991B1B]/25 blur-[110px]" />
          <div className="relative mx-auto w-full max-w-6xl">
            <p className="eyebrow text-accent-400">The workflow</p>
            <h2 className="mt-3 max-w-3xl font-display text-[clamp(2rem,4.5vw,4.25rem)] font-extrabold leading-[1.02] tracking-[-0.025em] text-white">
              Every video, from raw footage to delivered.
            </h2>
            <div className="relative mt-14">
              <div className="absolute left-0 right-0 top-[18px] hidden h-px bg-white/10 md:block" aria-hidden="true">
                <div className="stage-line-fill h-full origin-left bg-gradient-to-r from-accent-500 to-[#ff8a9b]" />
              </div>
              <ol className="relative grid gap-6 md:grid-cols-6 md:gap-4">
                {VIDEO_STATUSES.map((status, index) => (
                  <li key={status} className="stage flex items-start gap-4 md:flex-col md:gap-0">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-accent-500/60 bg-[#09090b] font-display text-sm font-bold text-accent-400 shadow-[0_0_24px_rgba(255, 51, 75,0.35)]">
                      {index + 1}
                    </span>
                    <div className="md:mt-5">
                      <p className="font-display text-lg font-bold text-white">{VIDEO_STATUS_LABEL[status]}</p>
                      <p className="mt-1 text-sm text-[#8e8e93]">{STAGE_NOTES[status]}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Services() {
  const scope = useRef(null)
  useGSAP(() => {
    gsap.from('.bento-card', {
      y: 40, autoAlpha: 0, duration: 1, stagger: 0.12, ease: 'cinematic',
      scrollTrigger: { trigger: scope.current, start: 'top 75%', toggleActions: 'play none none none' },
    })
    gsap.from('.services-head > *', {
      y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: scope.current, start: 'top 80%' },
    })
    const mm = gsap.matchMedia()
    mm.add('(max-width: 768px)', () => {
      gsap.utils.toArray('.bento-card').forEach((card) => {
        ScrollTrigger.create({ trigger: card, start: 'top 60%', end: 'bottom 40%', toggleClass: 'is-in-view' })
      })
    })
  }, { scope })

  return (
    <section ref={scope} className="relative z-10 border-t border-white/[0.08] px-4 py-28 sm:px-6 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="services-head max-w-2xl">
          <p className="eyebrow text-accent-400">Services</p>
          <h2 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.025em] text-white">Every format your channel needs.</h2>
          <p className="mt-3 text-[#8e8e93]">One editor, one monthly workflow, every platform.</p>
        </div>
        <div className="mt-12 grid auto-rows-[minmax(200px,auto)] gap-5 md:grid-cols-12">
          {SERVICES.map((service, index) => (
            <article key={service.title} className={`bento-card flex flex-col p-7 ${index === 0 ? 'md:col-span-6 md:row-span-2' : index === 1 ? 'md:col-span-6' : 'md:col-span-3'}`}>
              <span className="bento-glow" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-bold tracking-[0.12em] text-accent-400">{String(index + 1).padStart(2, '0')}</span>
                <ArrowUpRight className="size-4 text-white/30" />
              </div>
              <h3 className={`mt-auto font-display font-bold tracking-tight text-white ${index === 0 ? 'text-4xl' : 'text-2xl'}`}>{service.title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#8e8e93]">{service.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Process() {
  const scope = useRef(null)
  useGSAP(() => {
    gsap.from('.process-entry', {
      y: 30, autoAlpha: 0, duration: 0.9, stagger: { amount: 0.5 }, ease: 'power3.out',
      scrollTrigger: { trigger: scope.current, start: 'top 80%' },
    })
  }, { scope })

  return (
    <section ref={scope} className="relative z-10 border-t border-white/[0.08] px-4 py-28 sm:px-6 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow text-accent-400">Process</p>
        <h2 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold tracking-[-0.025em] text-white">How we work together.</h2>
        <div className="mt-12 divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {PROCESS.map((item, index) => (
            <motion.article
              key={item.title}
              whileHover={{ x: 6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="process-entry group grid gap-3 py-8 md:grid-cols-[120px_1fr_1.4fr] md:items-baseline"
              data-cursor="hover"
            >
              <span className="font-display text-sm font-bold tracking-[0.12em] text-accent-400">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="font-display text-2xl font-bold tracking-tight text-white transition-colors group-hover:text-accent-400">{item.title}</h3>
              <p className="text-[#8e8e93]">{item.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCall() {
  const scope = useRef(null)
  useGSAP(() => {
    gsap.from('.final-call > *', {
      y: 30, autoAlpha: 0, duration: 1, stagger: 0.12, ease: 'cinematic',
      scrollTrigger: { trigger: scope.current, start: 'top 75%' },
    })
  }, { scope })

  return (
    <section ref={scope} className="relative z-10 overflow-hidden px-4 py-36 text-center sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 size-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-600/15 blur-[140px]" />
      <div className="final-call relative mx-auto max-w-3xl">
        <p className="eyebrow text-accent-400">Work with me</p>
        <h2 className="mt-4 font-display text-[clamp(2.5rem,6vw,5.5rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-white">Content that needs editing every month?</h2>
        <p className="mx-auto mt-6 max-w-lg text-lg text-[#8e8e93]">Tell me about your channel and volume. I reply to every inquiry.</p>
        <div className="mt-10">
          <Link to="/work-with-me" className={buttonClasses({ variant: 'accent', size: 'lg', className: 'group' })}>
            Start an inquiry <ArrowRight className="size-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <main id="main-content">
      <Hero />
      <Statement />
      <WorkflowShowcase />
      <Services />
      <Process />
      <FinalCall />
    </main>
  )
}
