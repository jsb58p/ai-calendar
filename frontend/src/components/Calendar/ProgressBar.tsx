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
      className="flex items-center gap-4 px-6 py-2 bg-bg-surface border-b border-border-default"
    >
      <span data-testid="progress-text" className="text-zinc-400 text-xs font-mono flex-shrink-0">
        {completed} / {total} complete
      </span>

      <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
        <div
          data-testid="progress-bar-fill"
          className="h-full bg-green-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      <span data-testid="progress-percent" className="text-zinc-400 text-xs font-mono flex-shrink-0">
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
