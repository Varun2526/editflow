import { videosApi } from '../../api/videos'
import { useToast } from '../../context/ToastContext'
import { useForm } from '../../hooks/useForm'
import { CONTENT_TYPES, CONTENT_TYPE_LABEL } from '../../utils/labels'
import { Button } from '../ui/Button'
import { FormError, SelectField, TextField } from '../ui/Field'
import { Modal } from '../ui/Modal'

/** Create (projectId) or edit (video) a video. Status is never part of this form. */
export function VideoFormModal({ open, onClose, projectId, video, onSaved }) {
  const toast = useToast()
  const editing = Boolean(video)
  const form = useForm(
    {
      title: video?.title ?? '',
      contentType: video?.contentType ?? 'REEL',
      deadline: video?.deadline ?? '',
      driveUrl: video?.driveUrl ?? '',
    },
    {
      validate: (v) => ({ title: v.title.trim() ? undefined : 'Enter a title' }),
      onSubmit: async (v) => {
        const body = { title: v.title.trim(), contentType: v.contentType, deadline: v.deadline || null, driveUrl: v.driveUrl.trim() || null }
        const saved = editing ? await videosApi.update(video.id, body) : await videosApi.create(projectId, body)
        toast.success(editing ? 'Video updated' : 'Video added')
        onSaved?.(saved)
        onClose()
      },
    },
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit video' : 'Add video'}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="video-form" loading={form.submitting}>{editing ? 'Save changes' : 'Add video'}</Button>
        </>
      )}
    >
      <form id="video-form" onSubmit={form.handleSubmit} noValidate className="space-y-4">
        <TextField label="Title" placeholder="Morning Workout Reel" {...form.field('title')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Content type" {...form.field('contentType')}>
            {CONTENT_TYPES.map((type) => <option key={type} value={type}>{CONTENT_TYPE_LABEL[type]}</option>)}
          </SelectField>
          <TextField label="Deadline" type="date" optional {...form.field('deadline')} />
        </div>
        <TextField label="Google Drive link" type="url" optional placeholder="https://drive.google.com/…" hint="Media stays on Drive; only the link is stored." {...form.field('driveUrl')} />
        <FormError message={form.formError} />
      </form>
    </Modal>
  )
}
