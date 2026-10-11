import { useAuth } from '../../context/AuthContext'
import { useForm } from '../../hooks/useForm'
import { Button } from '../ui/Button'
import { FormError, TextField } from '../ui/Field'

/** Uses POST /api/auth/change-password; the fresh token returned replaces the session. */
export function ChangePasswordForm({ onChanged, submitLabel = 'Update password' }) {
  const { changePassword } = useAuth()
  const form = useForm({ currentPassword: '', newPassword: '', confirmPassword: '' }, {
    validate: (v) => ({
      currentPassword: v.currentPassword ? undefined : 'Enter your current password',
      newPassword: v.newPassword.length >= 8 ? undefined : 'Use at least 8 characters',
      confirmPassword: v.confirmPassword === v.newPassword ? undefined : "Passwords don't match",
    }),
    onSubmit: async (values) => {
      const user = await changePassword(values.currentPassword, values.newPassword)
      form.setValues({ currentPassword: '', newPassword: '', confirmPassword: '' })
      onChanged?.(user)
    },
  })

  return (
    <form onSubmit={form.handleSubmit} noValidate className="space-y-4">
      <TextField label="Current password" type="password" autoComplete="current-password" {...form.field('currentPassword')} />
      <TextField label="New password" type="password" autoComplete="new-password" hint="At least 8 characters." {...form.field('newPassword')} />
      <TextField label="Confirm new password" type="password" autoComplete="new-password" {...form.field('confirmPassword')} />
      <FormError message={form.formError} />
      <Button type="submit" loading={form.submitting}>{submitLabel}</Button>
    </form>
  )
}
