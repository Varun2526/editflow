import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { homePathFor } from '../../utils/session'
import { buttonClasses } from '../../components/ui/buttonClasses'

export default function NotFound() {
  const { user } = useAuth()
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center">
      <p className="font-mono text-sm text-zinc-400">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-zinc-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to={user ? homePathFor(user) : '/'} className={buttonClasses({ variant: 'secondary', className: 'mt-6' })}>Go home</Link>
    </main>
  )
}
