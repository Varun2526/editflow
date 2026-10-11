import { Loader2 } from 'lucide-react'

export function FullPageSpinner() {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
      <Loader2 className="mr-2 size-4 animate-spin" />
      Loading
    </div>
  )
}
