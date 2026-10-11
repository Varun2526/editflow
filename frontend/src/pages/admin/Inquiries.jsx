import { useState } from 'react'
import { Inbox } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { inquiriesApi } from '../../api/inquiries'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { formatDate, formatDateTime, formatMoney } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataState, EmptyState } from '../../components/ui/States'
import { InquiryStatusBadge } from '../../components/ui/StatusBadges'
import { Table, Td, Th, Tr } from '../../components/ui/Table'
import { Tabs } from '../../components/ui/Tabs'
import { AcceptInquiryModal } from '../../components/domain/AcceptInquiryModal'
import { CredentialsModal } from '../../components/domain/CredentialsModal'

const FILTERS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: '', label: 'All' },
]

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-900">{children || '—'}</dd>
    </div>
  )
}

export default function Inquiries() {
  const toast = useToast()
  const [filter, setFilter] = useState('PENDING')
  const inquiries = useApi(() => inquiriesApi.list(filter), [filter])
  const [picked, setPicked] = useState(null)
  const [params, setParams] = useSearchParams()
  const openId = Number(params.get('open'))
  // Deep link from Today (?open=<id>): that inquiry is shown until the dialog is closed.
  const selected = picked ?? (openId ? inquiries.data?.find((inquiry) => inquiry.id === openId) ?? null : null)
  const setSelected = (inquiry) => {
    setPicked(inquiry)
    if (!inquiry && openId) setParams({}, { replace: true })
  }
  const [accepting, setAccepting] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [accepted, setAccepted] = useState(null)
  const [credentials, setCredentials] = useState(null)

  function onAccepted(result) {
    setAccepting(null)
    setSelected(null)
    setAccepted(result)
    toast.success(`${result.inquiry.name} accepted`)
    if (result.portalAccess) setCredentials(result.portalAccess)
    inquiries.reload()
  }

  return (
    <>
      <PageHeader title="Inquiries" description="Requests from the Work With Me form." />
      {accepted && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <span>
            {accepted.clientCreated ? 'New client created' : 'Existing client reused'} and project set up for <strong>{accepted.inquiry.name}</strong>. Next: add this month’s videos to the project.
          </span>
          <span className="flex gap-3">
            <Link className="font-medium underline" to={`/admin/clients/${accepted.clientId}`}>Open client</Link>
            <Link className="font-medium underline" to={`/admin/projects/${accepted.projectId}`}>Open project</Link>
          </span>
        </div>
      )}
      <div className="mb-4"><Tabs label="Filter inquiries" value={filter} onChange={setFilter} options={FILTERS} /></div>
      <Card>
        <DataState
          state={inquiries}
          isEmpty={(list) => list.length === 0}
          empty={(
            <EmptyState
              icon={Inbox}
              title={filter === 'PENDING' ? 'No inquiries waiting for you' : 'No inquiries here'}
              description="Inquiries arrive from your public Work With Me page. Accepting one creates the client, their portal login and their first project."
              action={<a href="/work-with-me" target="_blank" rel="noreferrer" className="text-sm font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-500">Open your Work With Me page</a>}
            />
          )}
        >
          {(list) => (
            <Table>
              <thead><tr><Th>From</Th><Th>Content</Th><Th align="right">Videos / month</Th><Th align="right">Budget</Th><Th>Received</Th><Th>Status</Th></tr></thead>
              <tbody>
                {list.map((inquiry) => (
                  <Tr key={inquiry.id} onClick={() => setSelected(inquiry)}>
                    <Td>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setSelected(inquiry) }} className="font-medium text-zinc-900 hover:text-zinc-500">{inquiry.name}</button>
                      <p className="text-xs text-zinc-500">{inquiry.email}</p>
                    </Td>
                    <Td>{inquiry.contentType}</Td>
                    <Td align="right">{inquiry.videosPerMonth}</Td>
                    <Td align="right">{formatMoney(inquiry.budget)}</Td>
                    <Td className="whitespace-nowrap text-zinc-500">{formatDateTime(inquiry.createdAt)}</Td>
                    <Td><InquiryStatusBadge status={inquiry.status} /></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </DataState>
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name}
        description={selected && `Received ${formatDateTime(selected.createdAt)}`}
        footer={selected?.status === 'PENDING' ? (
          <>
            <Button variant="secondary" onClick={() => setRejecting(selected)}>Reject</Button>
            <Button onClick={() => setAccepting(selected)}>Accept…</Button>
          </>
        ) : selected?.status === 'ACCEPTED' && (
          <>
            <Link className="text-sm font-medium text-zinc-700 underline" to={`/admin/clients/${selected.clientId}`}>Open client</Link>
            <Link className="text-sm font-medium text-zinc-700 underline" to={`/admin/projects/${selected.projectId}`}>Open project</Link>
          </>
        )}
      >
        {selected && (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Email">{selected.email}</Detail>
            <Detail label="Phone / Instagram">{selected.phoneOrInstagram}</Detail>
            <Detail label="Content type">{selected.contentType}</Detail>
            <Detail label="Videos per month">{selected.videosPerMonth}</Detail>
            <Detail label="Monthly budget">{formatMoney(selected.budget)}</Detail>
            <Detail label="Wants to start">{selected.deadline && formatDate(selected.deadline)}</Detail>
            <div className="sm:col-span-2"><Detail label="Description"><span className="whitespace-pre-line">{selected.description}</span></Detail></div>
            <Detail label="Status"><InquiryStatusBadge status={selected.status} /></Detail>
          </dl>
        )}
      </Modal>

      {accepting && <AcceptInquiryModal inquiry={accepting} onClose={() => setAccepting(null)} onAccepted={onAccepted} />}
      <ConfirmDialog
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title="Reject inquiry?"
        message={rejecting ? `${rejecting.name}'s inquiry will be marked as rejected.` : ''}
        confirmLabel="Reject"
        danger
        onConfirm={async () => {
          await inquiriesApi.reject(rejecting.id)
          toast.success('Inquiry rejected')
          setSelected(null)
          inquiries.reload()
        }}
      />
      <CredentialsModal credentials={credentials} onClose={() => setCredentials(null)} />
    </>
  )
}
