import type { Schedule } from '../../types'

interface Props {
  schedule: Schedule
}

export function ProgressBar({ schedule }: Props) {
  const total = schedule.tasks.length
  const completed = schedule.tasks.filter((t) => t.status === 'complete').length
  const skipped = schedule.tasks.filter((t) => t.status === 'skipped').length
  const percentComplete = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div data-testid="progress-bar-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span data-testid="progress-text">{completed} / {total} complete</span>
        <span data-testid="progress-percent">{percentComplete}%</span>
      </div>

      <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          data-testid="progress-bar-fill"
          style={{ height: '100%', width: `${percentComplete}%`, backgroundColor: '#22c55e', borderRadius: '4px' }}
        />
      </div>

      {skipped > 0 && (
        <span data-testid="skipped-count" style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
          {skipped} skipped
        </span>
      )}
    </div>
  )
}
