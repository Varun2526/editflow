import { useState } from 'react'
import { projectsApi } from '../../api/projects'
import { useToast } from '../../context/ToastContext'
import { useForm } from '../../hooks/useForm'
import { MONTH_NAMES } from '../../utils/format'
import { Button } from '../ui/Button'
import { FormError, SelectField, TextArea, TextField } from '../ui/Field'
import { Modal } from '../ui/Modal'

/**
 * Create (clientId or a client picker via `clients`) or edit (project) a monthly project.
 * The one-project-per-month rule and the fee/paid check are enforced by the backend (409/400).
 */
export function ProjectFormModal({ open, onClose, project, clientId, clients, onSaved }) {
  const toast = useToast()
  const editing = Boolean(project)
  const [now] = useState(() => new Date())
  const form = useForm(
    {
      clientId: clientId ?? project?.clientId ?? '',
      name: project?.name ?? '',
      month: String(project?.month ?? now.getMonth() + 1),
      year: String(project?.year ?? now.getFullYear()),
      totalFee: project?.totalFee ?? '',
      description: project?.description ?? '',
    },
    {
      validate: (v) => ({
        clientId: v.clientId ? undefined : 'Choose a client',
        name: v.name.trim() ? undefined : 'Enter a project name',
        totalFee: v.totalFee !== '' && Number(v.totalFee) >= 0 ? undefined : 'Enter the monthly fee (₹0 or more)',
      }),
      onSubmit: async (v) => {
        const body = {
          name: v.name.trim(), description: v.description.trim() || null,
          month: Number(v.month), year: Number(v.year), totalFee: Number(v.totalFee),
        }
        const saved = editing ? await projectsApi.update(project.id, body) : await projectsApi.create(v.clientId, body)
        toast.success(editing ? 'Project updated' : 'Project created')
        onSaved?.(saved)
        onClose()
      },
    },
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit project' : 'New project'}
      description={editing ? undefined : 'One project per client per month.'}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="project-form" loading={form.submitting}>{editing ? 'Save changes' : 'Create project'}</Button>
        </>
      )}
    >
      <form id="project-form" onSubmit={form.handleSubmit} noValidate className="space-y-4">
        {!editing && !clientId && (
          <SelectField label="Client" {...form.field('clientId')}>
            <option value="">Select a client…</option>
            {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
        )}
        <TextField label="Project name" placeholder={`${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()} Content`} {...form.field('name')} />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Month" {...form.field('month')}>
            {MONTH_NAMES.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </SelectField>
          <TextField label="Year" type="number" min="2000" max="2100" {...form.field('year')} />
        </div>
        <TextField label="Monthly fee (₹)" type="number" min="0" step="0.01" {...form.field('totalFee')} />
        <TextArea label="Description" optional {...form.field('description')} />
        <FormError message={form.formError} />
      </form>
    </Modal>
  )
}
