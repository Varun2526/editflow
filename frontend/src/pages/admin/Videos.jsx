import { useMemo, useState } from 'react'
import { Film, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { videosApi } from '../../api/videos'
import { useApi } from '../../hooks/useApi'
import { formatDate } from '../../utils/format'
import { CONTENT_TYPE_LABEL, VIDEO_STATUSES, VIDEO_STATUS_LABEL } from '../../utils/labels'
import { ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DriveLink } from '../../components/ui/DriveLink'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataState, EmptyState } from '../../components/ui/States'
import { OverdueBadge, VideoStatusBadge } from '../../components/ui/StatusBadges'
import { Table, Td, Th, Tr } from '../../components/ui/Table'
import { Tabs } from '../../components/ui/Tabs'
import { VideoStatusControl } from '../../components/domain/VideoStatusControl'

const FILTERS = [{ value: '', label: 'All' }, ...VIDEO_STATUSES.map((s) => ({ value: s, label: VIDEO_STATUS_LABEL[s] }))]

/** Every video outside archived projects, across clients. */
export default function Videos() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const videos = useApi(() => videosApi.listAll(status), [status])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!videos.data || !q) return videos.data
    return videos.data.filter((item) => [item.video.title, item.clientName, item.projectName].some((v) => v.toLowerCase().includes(q)))
  }, [videos.data, query])

  return (
    <>
      <PageHeader title="Videos" description="All videos in active and completed projects." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs label="Filter by status" value={status} onChange={setStatus} options={FILTERS} />
      </div>
      <Card>
        <div className="border-b border-zinc-100 p-3">
          <label className="relative block max-w-xs">
            <span className="sr-only">Search videos</span>
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-zinc-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, client, project" className="h-9 w-full rounded-md border border-zinc-200 pl-8 pr-3 text-sm focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </label>
        </div>
        <DataState
          state={{ ...videos, data: filtered }}
          isEmpty={(list) => list.length === 0}
          empty={<EmptyState icon={Film} title={status ? `No videos ${VIDEO_STATUS_LABEL[status].toLowerCase()}` : 'No videos yet'} description={status ? 'Videos appear here when they reach this stage.' : 'Videos are added inside a project — open one and choose “Add video”.'} action={!status && <ButtonLink to="/admin/projects" variant="secondary" size="sm">Go to projects</ButtonLink>} />}
        >
          {(list) => (
            <Table>
              <thead><tr><Th>Video</Th><Th>Client · Project</Th><Th>Status</Th><Th>Deadline</Th><Th align="right">Next step</Th></tr></thead>
              <tbody>
                {list.map(({ video, clientName, projectName }) => (
                  <Tr key={video.id} onClick={() => navigate(`/admin/videos/${video.id}`)}>
                    <Td>
                      <Link to={`/admin/videos/${video.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-zinc-900 hover:text-zinc-500">{video.title}</Link>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                        {CONTENT_TYPE_LABEL[video.contentType]}
                        {video.openRevisionCount > 0 && <span>{video.openRevisionCount} open revision{video.openRevisionCount === 1 ? '' : 's'}</span>}
                        {video.driveUrl && <DriveLink url={video.driveUrl} label="Drive" />}
                      </p>
                    </Td>
                    <Td><p>{clientName}</p><p className="text-xs text-zinc-500">{projectName}</p></Td>
                    <Td><VideoStatusBadge status={video.status} /></Td>
                    <Td className="whitespace-nowrap">
                      <span className={video.overdue ? 'font-medium text-red-600' : ''}>{formatDate(video.deadline)}</span>
                      {video.overdue && <div className="mt-1"><OverdueBadge /></div>}
                    </Td>
                    <Td align="right"><VideoStatusControl compact video={video} onChanged={videos.reload} /></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </DataState>
      </Card>
    </>
  )
}
