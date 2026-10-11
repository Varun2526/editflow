import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'

/**
 * Overflow (⋯) menu for secondary actions, so rows show one primary action only. Rendered in a
 * portal with fixed positioning, so it is never clipped by scrolling tables.
 * items: [{ label, icon, onSelect, danger, hidden }]
 */
export function ActionMenu({ items, label = 'More actions' }) {
  const visible = items.filter((item) => !item.hidden)
  const buttonRef = useRef(null)
  const [position, setPosition] = useState(null)

  useEffect(() => {
    if (!position) return undefined
    const close = () => setPosition(null)
    const onKey = (event) => event.key === 'Escape' && close()
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', close)
    }
  }, [position])

  if (visible.length === 0) return null

  const toggle = (event) => {
    event.stopPropagation()
    if (position) {
      setPosition(null)
      return
    }
    const rect = buttonRef.current.getBoundingClientRect()
    setPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(position)}
        onClick={toggle}
        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {position && createPortal(
        <div
          role="menu"
          onPointerDown={(event) => event.stopPropagation()}
          style={{ top: position.top, right: position.right }}
          className="fixed z-50 min-w-48 animate-dialog-in rounded-xl border border-zinc-200 bg-white p-1 shadow-xl shadow-zinc-900/10"
        >
          {visible.map(({ label: itemLabel, icon: Icon, onSelect, danger }) => (
            <button
              key={itemLabel}
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation()
                setPosition(null)
                onSelect()
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                danger ? 'text-red-600 hover:bg-red-50' : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              {Icon && <Icon className="size-4 opacity-70" />}
              {itemLabel}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
