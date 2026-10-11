import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { subscribeServerSlow } from '../../api/serverStatus'

/** Small floating notice while a request is slow (typically the backend waking from sleep). */
export function ServerWakeNotice() {
  const [slow, setSlow] = useState(false)
  useEffect(() => subscribeServerSlow(setSlow), [])
  if (!slow) return null
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex justify-center px-4">
      <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-zinc-900/95 px-4 py-2.5 text-sm text-zinc-100 shadow-xl shadow-black/30 backdrop-blur">
        <Loader2 className="size-4 animate-spin text-zinc-400" aria-hidden="true" />
        <span>Waking up the server — the first request can take up to a minute…</span>
      </div>
    </div>
  )
}
