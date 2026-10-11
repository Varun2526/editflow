import { useLayoutEffect, useRef, useState } from 'react'

/** Segmented filter / tab control with a sliding selection pill. */
export function Tabs({ value, onChange, options, label }) {
  const listRef = useRef(null)
  const [pill, setPill] = useState(null)

  useLayoutEffect(() => {
    const measure = () => {
      const selected = listRef.current?.querySelector('[aria-selected="true"]')
      if (!selected) return
      const next = { left: selected.offsetLeft, width: selected.offsetWidth }
      setPill((current) => (current && current.left === next.left && current.width === next.width ? current : next))
    }
    measure()
    if (typeof ResizeObserver === 'undefined' || !listRef.current) return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(listRef.current)
    return () => observer.disconnect()
  }, [value, options.length])

  return (
    <div ref={listRef} role="tablist" aria-label={label} className="relative inline-flex max-w-full gap-0.5 overflow-x-auto rounded-lg bg-zinc-100 p-0.5">
      {pill && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0.5 rounded-md bg-white shadow-sm ring-1 ring-zinc-900/5 transition-[left,width] duration-300 ease-out-expo"
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`relative z-10 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-200 ${
              selected ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
            } ${pill ? '' : selected ? 'bg-white shadow-sm' : ''}`}
          >
            {option.label}
            {option.count !== undefined && <span className="ml-1.5 text-zinc-400 tabular">{option.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
