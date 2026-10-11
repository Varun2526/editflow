import { useState } from 'react'
import { FolderKanban, KeyRound, Pencil, Plus } from 'lucide-react'
import { useParams } from 'react-router'
import { clientsApi } from '../../api/clients'
import { useApi } from '../../hooks/useApi'
import { formatPeriod } from '../../utils/format'
import { Badge } from '../../components/ui/Badge'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { PageHeader } from '../../components/ui/PageHeader'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { DataState, EmptyState, PageSkeleton } from '../../components/ui/States'
import { ProjectStatusBadge } from '../../components/ui/StatusBadges'
import { ClientFormModal } from '../../components/domain/ClientFormModal'
import { CredentialsModal } from '../../components/domain/CredentialsModal'
import { PaymentSummary } from '../../components/domain/PaymentSummary'
import { ProjectFormModal } from '../../components/domain/ProjectFormModal'
import { ProjectTable } from '../../components/domain/ProjectTable'

function InfoRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right text-zinc-900">{children || '—'}</dd>
    </div>
  )
}

export default function ClientDetail() {
  const { id } = useParams()
  const client = useApi(() => clientsApi.get(id), [id])
  const [editing, setEditing] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [confirmAccess, setConfirmAccess] = useState(false)
  const [credentials, setCredentials] = useState(null)

  return (
    <DataState state={client} loading={<PageSkeleton />}>
      {(c) => (
        <>
          <PageHeader
            back={{ to: '/admin/clients', label: 'Clients' }}
            eyebrow="Client"
            title={c.name}
            description={c.companyName}
            actions={(
              <>
                <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Edit</Button>
                <Button icon={Plus} onClick={() => setCreatingProject(true)}>New project</Button>
              </>
            )}
          />
          <div className="stagger grid gap-4 lg:grid-cols-3">
            <div className="space-y-4">
              <Card className="p-5">
                <h2 className="text-sm font-semibold">Details</h2>
                <dl className="mt-2 divide-y divide-zinc-100">
                  <InfoRow label="Email">{c.email}</InfoRow>
                  <InfoRow label="Phone">{c.phone}</InfoRow>
                  <InfoRow label="Instagram">{c.instagram}</InfoRow>
                  <InfoRow label="Company">{c.companyName}</InfoRow>
                </dl>
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Portal access</h2>
                  {c.hasPortalAccess ? <Badge tone="green">Active</Badge> : <Badge>Not set up</Badge>}
                </div>
                <p className="mt-2 text-sm text-zinc-500">
                  {c.hasPortalAccess
                    ? 'The client can sign in to see their projects, videos and payments.'
                    : 'Create a login so the client can follow their projects.'}
                </p>
                <Button variant="secondary" size="sm" icon={KeyRound} className="mt-3" onClick={() => setConfirmAccess(true)}>
                  {c.hasPortalAccess ? 'Reset password' : 'Create portal login'}
                </Button>
              </Card>
              <Card className="p-5">
                <h2 className="text-sm font-semibold">Internal notes</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-zinc-600">{c.notes || 'No notes.'}</p>
                <p className="mt-3 text-xs text-zinc-400">Never shown in the client portal.</p>
              </Card>
            </div>

            <div className="space-y-4 lg:col-span-2">
              <Card>
                <CardHeader
                  title="Current project"
                  action={c.currentProject && <ButtonLink to={`/admin/projects/${c.currentProject.id}`} variant="secondary" size="sm">Open workspace</ButtonLink>}
                />
                {c.currentProject ? (
                  <div className="space-y-5 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{c.currentProject.name}</p>
                        <p className="text-sm text-zinc-500">{formatPeriod(c.currentProject.month, c.currentProject.year)}</p>
                      </div>
                      <ProjectStatusBadge status={c.currentProject.status} />
                    </div>
                    <div>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="text-zinc-500">{c.currentProject.videos.done} of {c.currentProject.videos.total} videos completed</span>
                        <span className="font-medium tabular">{c.currentProject.videos.progressPercent}%</span>
                      </div>
                      <ProgressBar percent={c.currentProject.videos.progressPercent} />
                    </div>
                    <PaymentSummary summary={c.currentProject.payment} />
                  </div>
                ) : (
                  <EmptyState compact icon={FolderKanban} title="No projects yet" action={<Button size="sm" icon={Plus} onClick={() => setCreatingProject(true)}>New project</Button>} />
                )}
              </Card>
              {c.projects.length > 0 && (
                <Card>
                  <CardHeader title="All projects" />
                  <ProjectTable projects={c.projects} showClient={false} />
                </Card>
              )}
            </div>
          </div>

          {editing && <ClientFormModal open client={c} onClose={() => setEditing(false)} onSaved={client.reload} />}
          {creatingProject && <ProjectFormModal open clientId={c.id} onClose={() => setCreatingProject(false)} onSaved={client.reload} />}
          <ConfirmDialog
            open={confirmAccess}
            onClose={() => setConfirmAccess(false)}
            title={c.hasPortalAccess ? 'Reset portal password?' : 'Create portal login?'}
            message={c.hasPortalAccess
              ? `${c.name} will get a new temporary password and their current one will stop working.`
              : `A login for ${c.email} will be created with a temporary password.`}
            confirmLabel={c.hasPortalAccess ? 'Reset password' : 'Create login'}
            onConfirm={async () => {
              setCredentials(await clientsApi.portalAccess(c.id))
              client.reload()
            }}
          />
          <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />
        </>
      )}
    </DataState>
  )
}
