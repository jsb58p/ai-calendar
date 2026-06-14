import type { Schedule } from '../../types'
import { Badge } from '../ui'

interface Props {
  schedule: Schedule
}

export function ProgressBar({ schedule }: Props) {
  const total = schedule.tasks.length
  const completed = schedule.tasks.filter((t) => t.status === 'complete').length
  const skipped = schedule.tasks.filter((t) => t.status === 'skipped').length
  const percentComplete = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div
      data-testid="progress-bar-container"
      className="bg-bg-surface border-b border-border-default px-6 py-2 flex items-center gap-4"
    >
      <span data-testid="progress-text" className="text-text-muted text-xs font-mono flex-shrink-0">
        {completed} / {total} complete
      </span>

      <div className="flex-1 bg-bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          data-testid="progress-bar-fill"
          className="bg-accent rounded-full h-full transition-all duration-500"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      <span data-testid="progress-percent" className="text-text-muted text-xs font-mono flex-shrink-0">
        {percentComplete}%
      </span>

      {skipped > 0 && (
        <Badge data-testid="skipped-count" variant="warning">
          {skipped} skipped
        </Badge>
      )}
    </div>
  )
}
