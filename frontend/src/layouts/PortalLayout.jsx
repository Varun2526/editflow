import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/ui/Logo'

const NAV = [
  { to: '/portal', label: 'Overview', end: true },
  { to: '/portal/projects', label: 'Projects' },
  { to: '/portal/payments', label: 'Payments' },
  { to: '/portal/profile', label: 'Profile' },
]

/** Client portal: a separate, simpler shell with top navigation that also works on phones. */
export function PortalLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  return (
    <div className="min-h-screen bg-zinc-50 bg-[radial-gradient(ellipse_70%_40%_at_100%_0%,rgba(255, 51, 75,0.08),transparent_60%)]">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/portal" className="flex items-center gap-3">
            <Logo />
            <span className="hidden rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 sm:inline">Client portal</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm text-zinc-600 sm:inline">{user?.name}</span>
            <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 sm:px-4">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `group relative whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                isActive ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {({ isActive }) => (
                <>
                  {label}
                  {/* Underline sweeps in from the left on hover; stays for the active page. */}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-3 -bottom-px h-0.5 origin-left rounded-full transition-transform duration-300 ease-out-expo ${
                      isActive ? 'scale-x-100 bg-zinc-900' : 'scale-x-0 bg-zinc-300 group-hover:scale-x-100'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </header>
      <main key={location.pathname} className="mx-auto max-w-5xl animate-fade-up px-4 py-6 sm:px-6 sm:py-9">
        <Outlet />
      </main>
    </div>
  )
}
