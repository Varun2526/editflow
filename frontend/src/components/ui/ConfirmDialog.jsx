import { useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { FormError } from './Field'
import { toApiError } from '../../api/errors'

/** Confirmation for irreversible or significant actions. Shows the backend's error if the action fails. */
export function ConfirmDialog({ open, onClose, title, message, confirmLabel = 'Confirm', danger = false, onConfirm }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const close = () => {
    setError(null)
    onClose()
  }

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      close()
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={confirm} loading={busy}>{confirmLabel}</Button>
        </>
      )}
    >
      <div className="space-y-3">
        <p className="text-sm text-zinc-600">{message}</p>
        <FormError message={error} />
      </div>
    </Modal>
  )
}
