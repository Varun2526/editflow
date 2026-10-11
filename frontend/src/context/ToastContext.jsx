import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, X, XCircle } from 'lucide-react'

const ToastContext = createContext(null)
let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), [])

  const show = useCallback((type, message) => {
    const id = nextId++
    setToasts((all) => [...all, { id, type, message }])
    setTimeout(() => dismiss(id), type === 'error' ? 6000 : 3500)
  }, [dismiss])

  const toast = useMemo(() => ({
    success: (message) => show('success', message),
    error: (message) => show('error', message),
  }), [show])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-xl shadow-zinc-900/10"
          >
            {t.type === 'error'
              ? <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
              : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />}
            <p className="flex-1 text-zinc-800">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} className="text-zinc-400 hover:text-zinc-700" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
