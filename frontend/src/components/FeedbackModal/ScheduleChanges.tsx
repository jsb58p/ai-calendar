import type { DiffEntry } from '../../utils/diff'

interface Props {
  diffs: DiffEntry[]
}

export function ScheduleChanges({ diffs }: Props) {
  if (diffs.length === 0) return null

  const rescheduled = diffs.filter((d) => d.type === 'rescheduled')
  const added       = diffs.filter((d) => d.type === 'added')
  const removed     = diffs.filter((d) => d.type === 'removed')

  return (
    <div data-testid="schedule-changes" className="space-y-2">
      <p data-testid="changes-heading" className="text-text-muted text-xs font-mono uppercase tracking-wider mb-3">
        SCHEDULE CHANGES
      </p>

      {rescheduled.map((d) => (
        <div key={d.task.id} data-testid="change-rescheduled" className="flex items-center gap-2 text-xs">
          <span className="text-warning">📅</span>
          <span className="text-text-primary font-medium">{d.task.title}</span>
          <span className="text-text-muted">→</span>
          <span className="text-text-muted line-through font-mono">{d.oldDate}</span>
          <span className="text-warning font-mono">{d.newDate}</span>
        </div>
      ))}

      {added.map((d) => (
        <div key={d.task.id} data-testid="change-added" className="flex items-center gap-2 text-xs">
          <span className="text-success">+</span>
          <span className="text-text-muted">Added:</span>
          <span className="text-success font-medium">{d.task.title}</span>
        </div>
      ))}

      {removed.map((d) => (
        <div key={d.task.id} data-testid="change-removed" className="flex items-center gap-2 text-xs">
          <span className="text-danger">❌</span>
          <span className="text-text-muted">Removed:</span>
          <span className="text-text-secondary line-through">{d.task.title}</span>
        </div>
      ))}
    </div>
  )
}
