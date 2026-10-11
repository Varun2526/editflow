import { useState } from 'react'
import { CheckCircle2, MessageSquareText } from 'lucide-react'
import { Link } from 'react-router'
import { revisionsApi } from '../../api/revisions'
import { toApiError } from '../../api/errors'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { formatDateTime } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataState, EmptyState } from '../../components/ui/States'
import { RevisionStatusBadge } from '../../components/ui/StatusBadges'
import { Tabs } from '../../components/ui/Tabs'

const FILTERS = [{ value: 'OPEN', label: 'Open' }, { value: 'RESOLVED', label: 'Resolved' }, { value: '', label: 'All' }]

export default function Revisions() {
  const toast = useToast()
  const [filter, setFilter] = useState('OPEN')
  const revisions = useApi(() => revisionsApi.listAll(filter), [filter])
  const [resolvingId, setResolvingId] = useState(null)

  async function resolve(id) {
    setResolvingId(id)
    try {
      await revisionsApi.resolve(id)
      toast.success('Revision resolved')
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setResolvingId(null)
      revisions.reload()
    }
  }

  return (
    <>
      <PageHeader title="Revisions" description="Timestamped change requests across all videos." />
      <div className="mb-4"><Tabs label="Filter revisions" value={filter} onChange={setFilter} options={FILTERS} /></div>
      <Card>
        <DataState
          state={revisions}
          isEmpty={(list) => list.length === 0}
          empty={<EmptyState icon={MessageSquareText} title={filter === 'OPEN' ? 'No open change requests' : 'No change requests yet'} description="When a client reviews a video in their portal and asks for a change, it lands here with the exact timecode. You can also log feedback you got on WhatsApp from the video page." />}
        >
          {(list) => (
            <ul className="divide-y divide-zinc-100">
              {list.map(({ revision, videoTitle, clientName, projectName }) => (
                <li key={revision.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
                  <span className="w-fit rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-white">{revision.timecode}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-900">{revision.comment}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      <Link to={`/admin/videos/${revision.videoId}`} className="font-medium text-zinc-700 hover:text-zinc-500">{videoTitle}</Link>
                      {' · '}{clientName} · {projectName}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {revision.requestedBy === 'CLIENT' ? 'Requested by client' : 'Logged by you'} {formatDateTime(revision.requestedAt)}
                      {revision.resolvedAt && ` · Resolved ${formatDateTime(revision.resolvedAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RevisionStatusBadge status={revision.status} />
                    {revision.status === 'OPEN' && (
                      <Button size="sm" variant="secondary" icon={CheckCircle2} loading={resolvingId === revision.id} onClick={() => resolve(revision.id)}>Resolve</Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DataState>
      </Card>
    </>
  )
}
