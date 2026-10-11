import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { usePresence } from '../../hooks/useMotion'

/**
 * Accessible dialog: Escape and backdrop close it, focus moves inside on open.
 * Enters with a short rise; when `open` turns false it plays a quick exit before unmounting.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const panelRef = useRef(null)
  const { mounted, closing } = usePresence(open, 160)
  // While closing, keep showing what was on screen (parents often clear their state on close).
  const lastContent = useRef(null)
  useEffect(() => {
    if (open) lastContent.current = { title, description, children, footer }
  })

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previous = document.activeElement
    const first = panelRef.current?.querySelector('input, select, textarea, button:not([data-close])')
    first?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open, onClose])

  if (!mounted) return null
  // eslint-disable-next-line react-hooks/refs
  const content = open || !lastContent.current ? { title, description, children, footer } : lastContent.current
  const width = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }[size]

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className={`absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px] ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative flex max-h-[92vh] w-full ${width} flex-col rounded-t-2xl bg-white shadow-2xl shadow-zinc-950/20 ring-1 ring-zinc-900/5 sm:rounded-2xl ${closing ? 'animate-dialog-out' : 'animate-dialog-in'}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 id="modal-title" className="font-display text-lg font-bold tracking-tight text-zinc-900">{content.title}</h2>
            {content.description && <p className="mt-0.5 text-sm text-zinc-500">{content.description}</p>}
          </div>
          <button type="button" data-close onClick={onClose} className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{content.children}</div>
        {content.footer && <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3">{content.footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
