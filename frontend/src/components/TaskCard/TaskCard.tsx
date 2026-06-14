import type { Task } from '../../types'

interface Props {
  task: Task
  onClick: (task: Task) => void
}

const cardClasses: Record<Task['status'], string> = {
  pending:  'border-l-warning bg-warning/5 hover:bg-warning/10',
  complete: 'border-l-success bg-success/5 opacity-60',
  skipped:  'border-l-bg-muted bg-bg-muted/30 opacity-40',
}

const dotClasses: Record<Task['status'], string> = {
  pending:  'bg-warning',
  complete: 'bg-success',
  skipped:  'bg-text-muted',
}

const titleClasses: Record<Task['status'], string> = {
  pending:  'text-text-primary text-xs font-medium leading-tight line-clamp-2',
  complete: 'text-text-secondary text-xs line-through leading-tight line-clamp-2',
  skipped:  'text-text-muted text-xs line-through leading-tight line-clamp-2',
}

export function TaskCard({ task, onClick }: Props) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(task)
    }
  }

  return (
    <div
      data-testid="task-card"
      tabIndex={0}
      role="button"
      aria-label={`${task.title}, status: ${task.status}`}
      onClick={() => onClick(task)}
      onKeyDown={handleKeyDown}
      className={`w-full text-left rounded-sm px-2 py-1.5 mb-1 cursor-pointer transition-all duration-100 border-l-2 group ${cardClasses[task.status]}`}
    >
      <div className="flex items-center">
        <span
          data-testid="status-dot"
          className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 flex-shrink-0 ${dotClasses[task.status]}`}
        />
        <span
          data-testid="task-title"
          className={titleClasses[task.status]}
        >
          {task.title}
        </span>
      </div>

      <p
        data-testid="task-time"
        className="text-text-muted text-xs font-mono mt-0.5 hidden group-hover:block"
      >
        ~{task.estimatedMinutes} min
      </p>
    </div>
  )
}
