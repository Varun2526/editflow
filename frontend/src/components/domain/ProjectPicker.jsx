import { formatPeriod } from '../../utils/format'

/** Chooses one of the client's own projects (list comes from /api/client/me/projects). */
export function ProjectPicker({ projects, value, onChange }) {
  if (projects.length <= 1) return null
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600">
      Project
      <select
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
      >
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name} · {formatPeriod(p.month, p.year)}</option>)}
      </select>
    </label>
  )
}
