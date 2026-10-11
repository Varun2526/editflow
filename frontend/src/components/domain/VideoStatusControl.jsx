import { useState } from 'react'
import { ArrowRight, Undo2 } from 'lucide-react'
import { ActionMenu } from '../ui/ActionMenu'
import { videosApi } from '../../api/videos'
import { toApiError } from '../../api/errors'
import { useToast } from '../../context/ToastContext'
import { isForward, transitionLabel, VIDEO_STATUS_LABEL } from '../../utils/labels'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'

/**
 * Workflow actions for one video. Only the transitions the backend returned in
 * `allowedTransitions` are offered. The UI never changes the status itself: it calls the API and
 * then asks the page to re-fetch, both on success and on rejection (e.g. 409 from a stale screen).
 *
 * corrections: 'inline' shows backward moves as buttons; 'menu' tucks them (plus `menuItems`)
 * into a ⋯ menu so the row shows only the next step.
 */
export function VideoStatusControl({ video, onChanged, compact = false, corrections: correctionMode = 'inline', menuItems = [], hideForward = false }) {
  const toast = useToast()
  const [pending, setPending] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const [error, setError] = useState(null)

  const forward = video.allowedTransitions.filter((s) => isForward(video.status, s))
  const corrections = video.allowedTransitions.filter((s) => !isForward(video.status, s))

  async function apply(target) {
    setPending(target)
    setError(null)
    try {
      await videosApi.changeStatus(video.id, target)
      toast.success(`${video.title}: ${VIDEO_STATUS_LABEL[target]}`)
    } catch (err) {
      const message = toApiError(err).message
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setPending(null)
      onChanged?.()
    }
  }

  const run = (target) => apply(target).catch(() => {})

  if (video.allowedTransitions.length === 0 && menuItems.filter((i) => !i.hidden).length === 0) return null

  return (
    // Stop clicks (including from the portal-rendered dialog) reaching clickable table rows.
    <div className={compact ? 'flex items-center justify-end gap-1' : 'space-y-2'} onClick={(event) => event.stopPropagation()}>
      <div className={`flex items-center gap-2 ${compact ? 'justify-end' : 'flex-wrap'}`}>
        {!hideForward && forward.map((target) => (
          <Button
            key={target}
            size="sm"
            variant={compact ? 'secondary' : 'primary'}
            icon={compact ? undefined : ArrowRight}
            loading={pending === target}
            disabled={pending !== null}
            onClick={(event) => { event.stopPropagation(); run(target) }}
          >
            {transitionLabel(video.status, target)}
          </Button>
        ))}
        {correctionMode === 'inline' && corrections.map((target) => (
          <Button
            key={target}
            size="sm"
            variant="ghost"
            icon={Undo2}
            disabled={pending !== null}
            title={transitionLabel(video.status, target)}
            aria-label={transitionLabel(video.status, target)}
            onClick={(event) => { event.stopPropagation(); setConfirming(target) }}
          >
            {compact ? null : transitionLabel(video.status, target)}
          </Button>
        ))}
        {correctionMode === 'menu' && (
          <ActionMenu
            items={[
              ...corrections.map((target) => ({ label: transitionLabel(video.status, target), icon: Undo2, onSelect: () => setConfirming(target) })),
              ...menuItems,
            ]}
          />
        )}
      </div>
      {!compact && error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <ConfirmDialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={confirming ? transitionLabel(video.status, confirming) : ''}
        message={confirming
          ? `Move “${video.title}” back to ${VIDEO_STATUS_LABEL[confirming]}? Timestamps for later stages will be cleared.`
          : ''}
        confirmLabel="Move back"
        onConfirm={() => apply(confirming)}
      />
    </div>
  )
}
