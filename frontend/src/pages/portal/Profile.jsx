import { portalApi } from '../../api/portal'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { Card, CardHeader } from '../../components/ui/Card'
import { DataState } from '../../components/ui/States'
import { ChangePasswordForm } from '../../components/domain/ChangePasswordForm'

export default function Profile() {
  const toast = useToast()
  const profile = useApi(() => portalApi.profile(), [])
  return (
    <>
      <h1 className="mb-5 font-display text-3xl font-bold tracking-tight">Profile</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Your details" description="Contact your editor to change these." />
          <DataState state={profile}>
            {(p) => (
              <dl className="divide-y divide-zinc-100 px-5">
                {[['Name', p.name], ['Email', p.email], ['Phone', p.phone], ['Instagram', p.instagram], ['Company', p.companyName]].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 py-3 text-sm">
                    <dt className="text-zinc-500">{label}</dt>
                    <dd className="text-right text-zinc-900">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
            )}
          </DataState>
        </Card>
        <Card>
          <CardHeader title="Change password" />
          <div className="p-5"><ChangePasswordForm onChanged={() => toast.success('Password updated')} /></div>
        </Card>
      </div>
    </>
  )
}
