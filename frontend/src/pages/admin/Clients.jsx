import { useMemo, useState } from 'react'
import { Plus, Search, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { clientsApi } from '../../api/clients'
import { useApi } from '../../hooks/useApi'
import { formatMoney, formatPeriod } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataState, EmptyState } from '../../components/ui/States'
import { Badge } from '../../components/ui/Badge'
import { PaymentStatusBadge } from '../../components/ui/StatusBadges'
import { Table, Td, Th, Tr } from '../../components/ui/Table'
import { ClientFormModal } from '../../components/domain/ClientFormModal'
import { CredentialsModal } from '../../components/domain/CredentialsModal'

export default function Clients() {
  const navigate = useNavigate()
  const clients = useApi(() => clientsApi.list(), [])
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [credentials, setCredentials] = useState(null)

  // Search filters the list already loaded from the API (no search endpoint is needed at this size).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!clients.data || !q) return clients.data
    return clients.data.filter((c) => [c.name, c.email, c.companyName, c.phone].some((v) => v?.toLowerCase().includes(q)))
  }, [clients.data, query])

  return (
    <>
      <PageHeader title="Clients" actions={<Button icon={Plus} onClick={() => setCreating(true)}>New client</Button>} />
      <Card>
        <div className="border-b border-zinc-100 p-3">
          <label className="relative block max-w-xs">
            <span className="sr-only">Search clients</span>
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, company"
              className="h-9 w-full rounded-md border border-zinc-200 pl-8 pr-3 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </label>
        </div>
        <DataState
          state={{ ...clients, data: filtered }}
          isEmpty={(list) => list.length === 0}
          empty={query
            ? <EmptyState compact title="No matching clients" description={`Nothing matches “${query}”.`} />
            : <EmptyState icon={Users} title="No clients yet" description="Clients are created when you accept an inquiry from your Work With Me page. You can also add someone you already work with." action={<Button icon={Plus} onClick={() => setCreating(true)}>New client</Button>} />}
        >
          {(list) => (
            <Table>
              <thead><tr><Th>Client</Th><Th>Contact</Th><Th>Current project</Th><Th align="right">Videos</Th><Th align="right">Monthly fee</Th><Th>Payment</Th><Th>Portal</Th></tr></thead>
              <tbody>
                {list.map((client) => {
                  const project = client.currentProject
                  return (
                    <Tr key={client.id} onClick={() => navigate(`/admin/clients/${client.id}`)}>
                      <Td>
                        <Link to={`/admin/clients/${client.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-zinc-900 hover:text-zinc-500">{client.name}</Link>
                        {client.companyName && <p className="text-xs text-zinc-500">{client.companyName}</p>}
                      </Td>
                      <Td>
                        <p>{client.email}</p>
                        {client.phone && <p className="text-xs text-zinc-500">{client.phone}</p>}
                      </Td>
                      <Td>{project ? <><p>{project.name}</p><p className="text-xs text-zinc-500">{formatPeriod(project.month, project.year)}</p></> : <span className="text-zinc-400">None</span>}</Td>
                      <Td align="right">{project ? `${project.videos.done}/${project.videos.total}` : '—'}</Td>
                      <Td align="right">{project ? formatMoney(project.totalFee) : '—'}</Td>
                      <Td>{project ? <PaymentStatusBadge status={project.payment.status} /> : '—'}</Td>
                      <Td>{client.hasPortalAccess ? <Badge tone="green">Active</Badge> : <Badge>None</Badge>}</Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </DataState>
      </Card>
      {creating && (
        <ClientFormModal
          open
          onClose={() => setCreating(false)}
          onSaved={(result) => {
            clients.reload()
            if (result.portalAccess) setCredentials(result.portalAccess)
          }}
        />
      )}
      <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  )
}
