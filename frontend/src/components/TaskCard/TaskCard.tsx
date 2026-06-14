import type { Task } from '../../types'

interface Props {
  task: Task
  onClick: (task: Task) => void
}

const statusDotClass: Record<Task['status'], string> = {
  complete: 'bg-green-500',
  pending: 'bg-yellow-400',
  skipped: 'bg-gray-400',
}

const cardOpacity: Record<Task['status'], string> = {
  complete: 'opacity-60',
  pending: 'opacity-100',
  skipped: 'opacity-40',
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
      className={`cursor-pointer rounded-md border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow ${cardOpacity[task.status]}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div
          data-testid="status-dot"
          className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDotClass[task.status]}`}
        />
        <span
          data-testid="task-title"
          className={`text-sm font-medium text-gray-800 truncate ${task.status === 'complete' ? 'line-through' : ''}`}
        >
          {task.title}
        </span>
      </div>

      <p
        data-testid="task-time"
        className="text-xs text-gray-500"
      >
        ~{task.estimatedMinutes} min
      </p>

      <p
        data-testid="task-description"
        className="text-xs text-gray-600 overflow-hidden line-clamp-2 mt-1"
      >
        {task.description}
      </p>
    </div>
  )
}
