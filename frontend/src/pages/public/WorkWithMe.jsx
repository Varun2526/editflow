import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router'
import { inquiriesApi } from '../../api/inquiries'
import { useForm } from '../../hooks/useForm'
import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/buttonClasses'
import { FormError, TextArea, TextField } from '../../components/ui/Field'
import { validateInquiry } from '../../utils/validation'
import { WaveBackground } from '../../cinematic/WaveBackground'

const CONTENT_OPTIONS = ['Reels', 'YouTube Shorts', 'YouTube videos', 'Podcasts']
const INITIAL = {
  name: '', email: '', phoneOrInstagram: '', contentTypes: [], videosPerMonth: '', budget: '', deadline: '', description: '',
}

export default function WorkWithMe() {
  const [submitted, setSubmitted] = useState(null)
  const form = useForm(INITIAL, {
    validate: validateInquiry,
    onSubmit: async (values) => {
      const response = await inquiriesApi.submit({
        name: values.name.trim(),
        email: values.email.trim(),
        phoneOrInstagram: values.phoneOrInstagram.trim(),
        contentType: values.contentTypes.join(', '),
        videosPerMonth: Number(values.videosPerMonth),
        budget: Number(values.budget),
        deadline: values.deadline || null,
        description: values.description.trim() || null,
      })
      setSubmitted(response)
    },
  })

  const toggleType = (type) => form.setValues((v) => ({
    ...v,
    contentTypes: v.contentTypes.includes(type) ? v.contentTypes.filter((t) => t !== type) : [...v.contentTypes, type],
  }))

  if (submitted) {
    return (
      <main className="relative mx-auto max-w-xl px-4 pb-24 pt-40 text-center sm:px-6">
        <CheckCircle2 className="mx-auto size-12 animate-pop text-accent-400" />
        <h1 className="mt-6 animate-fade-up font-display text-4xl font-extrabold tracking-tight text-white">{submitted.message}</h1>
        <p className="mt-3 text-zinc-400">I&apos;ll review your details and get back to you on WhatsApp or email shortly.</p>
        <Link to="/" className={buttonClasses({ variant: 'outlineDark', className: 'mt-8' })}>
          Back to home
        </Link>
      </main>
    )
  }

  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[85vh] opacity-70">
        <WaveBackground intensity={1.1} />
        <div className="vignette" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-[#09090b]" aria-hidden="true" />
      </div>
      <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-4 pb-24 pt-32 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:pt-40">
      <div>
        <p className="eyebrow animate-fade-up text-accent-400">Work with me</p>
        <h1 className="mt-4 animate-fade-up font-display text-5xl font-extrabold leading-[0.98] tracking-[-0.03em] text-white [animation-delay:60ms] sm:text-6xl">Tell me about your content.</h1>
        <p className="mt-5 text-zinc-400">
          Share what you create and how often. If we&apos;re a fit, you&apos;ll get a private portal to follow every
          video from raw footage to delivery.
        </p>
      </div>

      <form onSubmit={form.handleSubmit} noValidate className="animate-fade-up rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl shadow-black/40 [animation-delay:120ms] sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Name" autoComplete="name" {...form.field('name')} />
          <TextField label="Email" type="email" autoComplete="email" {...form.field('email')} />
          <TextField label="Phone or Instagram" placeholder="+91 98765 43210 or @handle" className="sm:col-span-2" {...form.field('phoneOrInstagram')} />

          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 text-[13px] font-medium text-zinc-700">Content type</legend>
            <div className="flex flex-wrap gap-2">
              {CONTENT_OPTIONS.map((type) => {
                const selected = form.values.contentTypes.includes(type)
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleType(type)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-[background-color,border-color,color,transform] duration-200 ease-out-expo active:scale-95 ${
                      selected ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-700 hover:border-zinc-400'
                    }`}
                  >
                    {type}
                  </button>
                )
              })}
            </div>
            {form.errors.contentType && <p className="mt-1.5 text-xs text-red-600">{form.errors.contentType}</p>}
          </fieldset>

          <TextField label="Videos per month" type="number" min="1" inputMode="numeric" {...form.field('videosPerMonth')} />
          <TextField label="Monthly budget (₹)" type="number" min="0" inputMode="numeric" {...form.field('budget')} />
          <TextField label="When do you want to start?" type="date" optional className="sm:col-span-2" {...form.field('deadline')} />
          <TextArea label="Anything else?" optional rows={4} placeholder="Channel link, style references, goals…" className="sm:col-span-2" {...form.field('description')} />
        </div>
        <div className="mt-5 space-y-3">
          <FormError message={form.formError} />
          <Button type="submit" size="lg" loading={form.submitting} className="w-full">Submit inquiry</Button>
          <p className="text-center text-xs text-zinc-500">
            By submitting, you agree to the <Link to="/terms" className="underline underline-offset-2 hover:text-zinc-900">Terms of Service</Link> and
            {' '}<Link to="/privacy" className="underline underline-offset-2 hover:text-zinc-900">Privacy Policy</Link>.
          </p>
        </div>
      </form>
      </div>
    </main>
  )
}
