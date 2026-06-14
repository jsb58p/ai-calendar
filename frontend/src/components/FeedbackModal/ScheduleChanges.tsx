import type { DiffEntry } from '../../utils/diff'

interface Props {
  diffs: DiffEntry[]
}

export function ScheduleChanges({ diffs }: Props) {
  if (diffs.length === 0) return null

  const rescheduled = diffs.filter((d) => d.type === 'rescheduled')
  const added = diffs.filter((d) => d.type === 'added')
  const removed = diffs.filter((d) => d.type === 'removed')

  return (
    <div data-testid="schedule-changes">
      <p data-testid="changes-heading" style={{ fontWeight: 700, marginBottom: '6px', fontSize: '13px' }}>
        Schedule Changes
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {rescheduled.map((d) => (
          <li key={d.task.id} data-testid="change-rescheduled" className="text-amber-600">
            📅 {d.task.title}: {d.oldDate} → {d.newDate}
          </li>
        ))}
        {added.map((d) => (
          <li key={d.task.id} data-testid="change-added" className="text-green-600">
            ✅ Added: {d.task.title} on {d.newDate}
          </li>
        ))}
        {removed.map((d) => (
          <li key={d.task.id} data-testid="change-removed" className="text-red-600">
            ❌ Removed: {d.task.title}
          </li>
        ))}
      </ul>
    </div>
  )
}
