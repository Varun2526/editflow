import { useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { warmUpServer } from '../../api/serverStatus'
import { useForm } from '../../hooks/useForm'
import { homePathFor } from '../../utils/session'
import { VIDEO_STATUSES, VIDEO_STATUS_LABEL } from '../../utils/labels'
import { Button } from '../../components/ui/Button'
import { FormError, TextField } from '../../components/ui/Field'
import { Logo } from '../../components/ui/Logo'
import { WaveBackground } from '../../cinematic/WaveBackground'

function BrandPanel() {
  return (
    <div className="grain relative hidden overflow-hidden bg-[#09090b] p-10 text-white lg:flex lg:flex-col lg:justify-between">
      <WaveBackground intensity={1.25} />
      <div className="vignette" aria-hidden="true" />
      <Link to="/" className="relative z-10"><Logo light /></Link>
      <div className="relative z-10">
        <p className="eyebrow text-accent-400">EditFlow</p>
        <h2 className="mt-4 max-w-md font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.03em]">
          Every video, revision and payment. One place.
        </h2>
        <ul aria-hidden="true" className="mt-10 space-y-2.5">
          {VIDEO_STATUSES.map((status, index) => (
            <li key={status} className="flex animate-fade-up items-center gap-3 text-sm text-zinc-400" style={{ animationDelay: `${150 + index * 60}ms` }}>
              <span className={`size-1.5 rounded-full ${index === VIDEO_STATUSES.length - 1 ? 'bg-accent-400' : 'bg-zinc-600'}`} />
              {VIDEO_STATUS_LABEL[status]}
            </li>
          ))}
        </ul>
      </div>
      <p className="relative z-10 text-xs text-zinc-400">Private workspace for the editor and their clients.</p>
    </div>
  )
}

export default function Login() {
  const { user, ready, login, sessionExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Start waking a sleeping backend while the visitor types their credentials.
  useEffect(() => warmUpServer(), [])

  const form = useForm({ email: '', password: '' }, {
    validate: (v) => ({
      email: v.email.trim() ? undefined : 'Enter your email',
      password: v.password ? undefined : 'Enter your password',
    }),
    onSubmit: async (values) => {
      const signedIn = await login(values.email, values.password)
      const from = location.state?.from
      const area = signedIn.role === 'ADMIN' ? '/admin' : '/portal'
      navigate(!signedIn.mustChangePassword && from?.startsWith(area) ? from : homePathFor(signedIn), { replace: true })
    },
  })

  if (ready && user) return <Navigate to={homePathFor(user)} replace />

  return (
    <div className="grid min-h-screen bg-zinc-50 lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />
      <div className="flex flex-col">
        <div className="px-6 py-5 lg:hidden"><Link to="/"><Logo /></Link></div>
        <main className="flex flex-1 items-start justify-center px-4 pt-10 sm:pt-20 lg:items-center lg:pt-0">
          <div className="w-full max-w-sm animate-fade-up">
            <h1 className="font-display text-3xl font-bold tracking-tight">Sign in</h1>
            <p className="mt-1.5 text-sm text-zinc-500">For the editor and existing clients.</p>
            {sessionExpired && (
              <p role="status" className="mt-5 animate-fade-up rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                Your session has expired. Please sign in again.
              </p>
            )}
            <form onSubmit={form.handleSubmit} noValidate className="mt-7 space-y-4">
              <TextField label="Email" type="email" autoComplete="username" {...form.field('email')} />
              <TextField label="Password" type="password" autoComplete="current-password" {...form.field('password')} />
              <FormError message={form.formError} />
              <Button type="submit" size="lg" loading={form.submitting} className="w-full">Sign in</Button>
            </form>
            <p className="mt-6 text-sm text-zinc-500">
              New here? <Link to="/work-with-me" className="font-medium text-zinc-900 underline-offset-4 hover:underline">Start an inquiry</Link>
            </p>
            <p className="mt-10 flex gap-4 text-xs text-zinc-400">
              <Link to="/terms" className="hover:text-zinc-700">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-zinc-700">Privacy Policy</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
