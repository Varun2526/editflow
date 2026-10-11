import { useState } from 'react'
import { Check, Copy, KeyRound } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

/** Shows a temporary portal password exactly once. It is never stored or shown again. */
export function CredentialsModal({ credentials, onClose }) {
  const [copied, setCopied] = useState(false)
  if (!credentials) return null
  const text = `EditFlow portal\nEmail: ${credentials.email}\nTemporary password: ${credentials.temporaryPassword}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Portal login created"
      description="Share these with the client. The password is shown only once."
      footer={(
        <>
          <Button variant="secondary" icon={copied ? Check : Copy} onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
          <Button onClick={onClose}>Done</Button>
        </>
      )}
    >
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-700"><KeyRound className="size-4" /> Temporary login</div>
        <dl className="space-y-2 text-sm">
          <div><dt className="text-xs text-zinc-500">Email</dt><dd className="font-mono">{credentials.email}</dd></div>
          <div><dt className="text-xs text-zinc-500">Temporary password</dt><dd className="font-mono text-base tracking-wide">{credentials.temporaryPassword}</dd></div>
        </dl>
      </div>
      <p className="mt-3 text-xs text-zinc-500">They&apos;ll be asked to choose their own password the first time they sign in.</p>
    </Modal>
  )
}
