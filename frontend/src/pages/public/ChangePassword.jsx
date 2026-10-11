import { useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { homePathFor } from '../../utils/session'
import { ChangePasswordForm } from '../../components/domain/ChangePasswordForm'
import { Logo } from '../../components/ui/Logo'

export default function ChangePassword() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const required = user?.mustChangePassword

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <div className="flex items-center justify-between px-6 py-5">
        <Logo />
        <button type="button" onClick={logout} className="text-sm text-zinc-500 hover:text-zinc-900">Sign out</button>
      </div>
      <main className="flex flex-1 items-start justify-center px-4 pt-10 sm:pt-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{required ? 'Set your password' : 'Change password'}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {required
              ? 'You signed in with a temporary password. Choose your own to continue.'
              : 'Update the password you use to sign in.'}
          </p>
          <div className="mt-6">
            <ChangePasswordForm
              submitLabel={required ? 'Save and continue' : 'Update password'}
              onChanged={(updated) => navigate(homePathFor(updated), { replace: true })}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
