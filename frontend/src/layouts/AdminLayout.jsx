import { useState } from 'react'
import { inquiriesApi } from '../api/inquiries'
import { useApi } from '../hooks/useApi'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { CreditCard, Film, FolderKanban, Inbox, LayoutDashboard, LogOut, Menu, MessageSquareText, Users, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePresence } from '../hooks/useMotion'
import { Logo } from '../components/ui/Logo'

// The workflow first (where work happens), then the record indexes (where you look things up).
const WORKFLOW = [
  { to: '/admin', label: 'Today', icon: LayoutDashboard, end: true },
  { to: '/admin/inquiries', label: 'Inquiries', icon: Inbox, badge: 'inquiries' },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/clients', label: 'Clients', icon: Users },
]
const RECORDS = [
  { to: '/admin/videos', label: 'All videos', icon: Film },
  { to: '/admin/revisions', label: 'All revisions', icon: MessageSquareText },
  { to: '/admin/payments', label: 'All payments', icon: CreditCard },
]

function NavItem({ item: { to, label, icon: Icon, end, badge }, onNavigate, counts, quiet }) {
  const count = badge ? counts[badge] : 0
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => `group relative flex items-center gap-2.5 rounded-lg px-2.5 ${quiet ? 'py-1.5 text-[13px]' : 'py-2 text-sm'} font-medium transition-[background-color,color,box-shadow] duration-200 ${
        isActive ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80' : quiet ? 'text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900' : 'text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900'
      }`}
    >
      {({ isActive }) => (
        <>
          <span aria-hidden="true" className={`absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-zinc-900 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
          <Icon className={`size-4 transition-colors duration-200 ${isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
          <span className="flex-1">{label}</span>
          {count > 0 && <span className="rounded-full bg-zinc-900 px-1.5 py-px text-[11px] font-semibold text-white tabular" aria-label={`${count} pending`}>{count}</span>}
        </>
      )}
    </NavLink>
  )
}

function Navigation({ onNavigate }) {
  const location = useLocation()
  // Re-checked on every navigation so the badge reflects inquiries just accepted or rejected.
  const pending = useApi(() => inquiriesApi.list('PENDING').then((list) => list.length).catch(() => 0), [location.pathname])
  const counts = { inquiries: pending.data ?? 0 }
  return (
    <nav className="space-y-6">
      <div className="space-y-0.5">
        {WORKFLOW.map((item) => <NavItem key={item.to} item={item} onNavigate={onNavigate} counts={counts} />)}
      </div>
      <div className="space-y-0.5">
        <p className="eyebrow mb-1.5 px-2.5 text-zinc-400">All records</p>
        {RECORDS.map((item) => <NavItem key={item.to} item={item} onNavigate={onNavigate} counts={counts} quiet />)}
      </div>
    </nav>
  )
}

function UserBlock() {
  const { user, logout } = useAuth()
  const initials = (user?.name ?? '?').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="flex items-center gap-3 border-t border-zinc-200 pt-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 font-display text-xs font-bold text-white">{initials}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900">{user?.name}</p>
        <p className="truncate text-xs text-zinc-500">{user?.email}</p>
      </div>
      <button type="button" onClick={logout} className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900" aria-label="Sign out" title="Sign out">
        <LogOut className="size-4" />
      </button>
    </div>
  )
}

export function AdminLayout() {
  const [open, setOpen] = useState(false)
  const drawer = usePresence(open, 200)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-zinc-50 bg-[radial-gradient(ellipse_70%_45%_at_100%_0%,rgba(255, 51, 75,0.07),transparent_60%)]">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-zinc-200/80 bg-zinc-100/50 px-3 py-5 lg:flex">
        <Link to="/admin" className="mb-7 px-2.5"><Logo /></Link>
        <div className="flex-1"><Navigation /></div>
        <UserBlock />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/85 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link to="/admin"><Logo /></Link>
        <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100" aria-label="Open menu">
          <Menu className="size-5" />
        </button>
      </header>

      {drawer.mounted && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className={`absolute inset-0 bg-zinc-950/30 backdrop-blur-[2px] ${drawer.closing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={() => setOpen(false)} />
          <div className={`absolute inset-y-0 left-0 flex w-72 flex-col bg-zinc-50 px-3 py-5 shadow-2xl ${drawer.closing ? 'animate-drawer-out' : 'animate-drawer-in'}`}>
            <div className="mb-7 flex items-center justify-between px-2.5">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-200/60" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1"><Navigation onNavigate={() => setOpen(false)} /></div>
            <UserBlock />
          </div>
        </div>
      )}

      {/* Keyed by path: each page fades in (entrance only, so navigation never waits on an exit). */}
      <main key={location.pathname} className="animate-fade-up px-4 py-6 sm:px-6 lg:ml-60 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
