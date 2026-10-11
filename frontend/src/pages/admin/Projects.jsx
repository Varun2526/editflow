import { useState } from 'react'
import { FolderKanban, Plus } from 'lucide-react'
import { clientsApi } from '../../api/clients'
import { projectsApi } from '../../api/projects'
import { useApi } from '../../hooks/useApi'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataState, EmptyState } from '../../components/ui/States'
import { Tabs } from '../../components/ui/Tabs'
import { ProjectFormModal } from '../../components/domain/ProjectFormModal'
import { ProjectTable } from '../../components/domain/ProjectTable'

const FILTERS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: '', label: 'All' },
]

export default function Projects() {
  const [filter, setFilter] = useState('ACTIVE')
  const projects = useApi(() => projectsApi.list(filter), [filter])
  const [creating, setCreating] = useState(false)
  const clients = useApi(() => (creating ? clientsApi.list() : Promise.resolve([])), [creating])

  return (
    <>
      <PageHeader title="Projects" description="Monthly projects across all clients." actions={<Button icon={Plus} onClick={() => setCreating(true)}>New project</Button>} />
      <div className="mb-4"><Tabs label="Filter projects" value={filter} onChange={setFilter} options={FILTERS} /></div>
      <Card>
        <DataState
          state={projects}
          isEmpty={(list) => list.length === 0}
          empty={filter && filter !== 'ACTIVE' ? (
            <EmptyState icon={FolderKanban} title={`No ${filter.toLowerCase()} projects`} description="Projects show up here when you change their status from the project workspace." />
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="No active projects"
              description="A project is one client’s month of videos. Accepting an inquiry creates one automatically — or start one for an existing client."
              action={<div className="flex flex-wrap justify-center gap-2"><ButtonLink to="/admin/inquiries" variant="secondary">View inquiries</ButtonLink><Button icon={Plus} onClick={() => setCreating(true)}>New project</Button></div>}
            />
          )}
        >
          {(list) => <ProjectTable projects={list} />}
        </DataState>
      </Card>
      {creating && clients.data && (
        <ProjectFormModal open clients={clients.data} onClose={() => setCreating(false)} onSaved={projects.reload} />
      )}
    </>
  )
}
