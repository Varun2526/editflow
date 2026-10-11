import { clientsApi } from '../../api/clients'
import { useToast } from '../../context/ToastContext'
import { useForm } from '../../hooks/useForm'
import { Button } from '../ui/Button'
import { FormError, TextArea, TextField } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { isEmail } from '../../utils/validation'

/** Create or edit a client. On create, portal access can be set up at the same time. */
export function ClientFormModal({ open, onClose, client, onSaved }) {
  const toast = useToast()
  const editing = Boolean(client)
  const form = useForm(
    {
      name: client?.name ?? '', email: client?.email ?? '', phone: client?.phone ?? '',
      instagram: client?.instagram ?? '', companyName: client?.companyName ?? '', notes: client?.notes ?? '',
      createPortalAccess: false,
    },
    {
      validate: (v) => ({
        name: v.name.trim() ? undefined : 'Enter the client name',
        email: isEmail(v.email) ? undefined : 'Enter a valid email',
      }),
      onSubmit: async (v) => {
        const body = {
          name: v.name.trim(), email: v.email.trim(), phone: v.phone, instagram: v.instagram,
          companyName: v.companyName, notes: v.notes,
          createPortalAccess: editing ? undefined : v.createPortalAccess,
        }
        const saved = editing ? await clientsApi.update(client.id, body) : await clientsApi.create(body)
        toast.success(editing ? 'Client updated' : 'Client created')
        onSaved?.(saved)
        onClose()
      },
    },
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Edit client' : 'New client'}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="client-form" loading={form.submitting}>{editing ? 'Save changes' : 'Create client'}</Button>
        </>
      )}
    >
      <form id="client-form" onSubmit={form.handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" {...form.field('name')} />
        <TextField label="Email" type="email" hint={editing && client.hasPortalAccess ? 'Also changes their portal login email.' : undefined} {...form.field('email')} />
        <TextField label="Phone" optional {...form.field('phone')} />
        <TextField label="Instagram" optional placeholder="@handle" {...form.field('instagram')} />
        <TextField label="Company" optional className="sm:col-span-2" {...form.field('companyName')} />
        <TextArea label="Internal notes" optional hint="Only visible to you, never in the client portal." className="sm:col-span-2" {...form.field('notes')} />
        {!editing && (
          <label className="flex items-start gap-2.5 text-sm text-zinc-700 sm:col-span-2">
            <input type="checkbox" className="mt-0.5 size-4 rounded border-zinc-300 accent-zinc-900" {...form.field('createPortalAccess')} checked={form.values.createPortalAccess} />
            <span>
              Create portal login
              <span className="block text-xs text-zinc-500">A temporary password is shown once; the client sets their own on first sign-in.</span>
            </span>
          </label>
        )}
        <div className="sm:col-span-2"><FormError message={form.formError} /></div>
      </form>
    </Modal>
  )
}
