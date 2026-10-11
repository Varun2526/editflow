import { useForm } from '../../hooks/useForm'
import { Button } from '../ui/Button'
import { FormError, TextArea, TextField } from '../ui/Field'

/** Timecode + comment. Format is validated by the backend (mm:ss or hh:mm:ss); errors show inline. */
export function RevisionForm({ onSubmit, submitLabel = 'Add revision' }) {
  const form = useForm({ timecode: '', comment: '' }, {
    validate: (v) => ({
      timecode: v.timecode.trim() ? undefined : 'Enter a timecode, e.g. 00:17',
      comment: v.comment.trim() ? undefined : 'Describe the change',
    }),
    onSubmit: async (v) => {
      await onSubmit({ timecode: v.timecode.trim(), comment: v.comment.trim() })
      form.setValues({ timecode: '', comment: '' })
    },
  })

  return (
    <form onSubmit={form.handleSubmit} noValidate className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <TextField label="Timecode" placeholder="00:17" inputMode="numeric" {...form.field('timecode')} />
        <TextArea label="Comment" rows={2} placeholder="Please make this transition faster." {...form.field('comment')} />
      </div>
      <FormError message={form.formError} />
      <Button type="submit" size="sm" loading={form.submitting}>{submitLabel}</Button>
    </form>
  )
}
