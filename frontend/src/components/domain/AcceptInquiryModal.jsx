import { useState } from 'react'
import { inquiriesApi } from '../../api/inquiries'
import { useForm } from '../../hooks/useForm'
import { MONTH_NAMES } from '../../utils/format'
import { Button } from '../ui/Button'
import { FormError, SelectField, TextArea, TextField } from '../ui/Field'
import { Modal } from '../ui/Modal'

/**
 * Collects the project details; the backend does everything else in one transaction
 * (client reuse/creation, project, portal login, duplicate protection).
 */
export function AcceptInquiryModal({ inquiry, onClose, onAccepted }) {
  const [now] = useState(() => new Date())
  const form = useForm(
    {
      projectName: `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()} Content`,
      month: String(now.getMonth() + 1),
      year: String(now.getFullYear()),
      totalFee: inquiry ? String(inquiry.budget) : '',
      description: inquiry?.description ?? '',
    },
    {
      validate: (v) => ({
        projectName: v.projectName.trim() ? undefined : 'Enter a project name',
        totalFee: v.totalFee !== '' && Number(v.totalFee) >= 0 ? undefined : 'Enter the agreed monthly fee',
      }),
      onSubmit: async (v) => {
        const result = await inquiriesApi.accept(inquiry.id, {
          projectName: v.projectName.trim(), description: v.description.trim() || null,
          month: Number(v.month), year: Number(v.year), totalFee: Number(v.totalFee),
        })
        onAccepted(result)
      },
    },
  )

  if (!inquiry) return null
  return (
    <Modal
      open
      onClose={onClose}
      title={`Accept ${inquiry.name}`}
      description="Creates (or reuses) the client and sets up their first project."
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="accept-form" loading={form.submitting}>Accept inquiry</Button>
        </>
      )}
    >
      <form id="accept-form" onSubmit={form.handleSubmit} noValidate className="space-y-4">
        <TextField label="Project name" {...form.field('projectName')} />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Month" {...form.field('month')}>
            {MONTH_NAMES.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </SelectField>
          <TextField label="Year" type="number" {...form.field('year')} />
        </div>
        <TextField label="Agreed monthly fee (₹)" type="number" min="0" step="0.01" hint="Pre-filled from their budget." {...form.field('totalFee')} />
        <TextArea label="Project description" optional {...form.field('description')} />
        <FormError message={form.formError} />
      </form>
    </Modal>
  )
}
