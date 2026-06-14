import { formatTime, cn } from '../../utils'
import { useCalendarStore } from '../../store'
import type { Task } from '../../types'

interface TaskCardProps {
  task: Task
}

const statusColors: Record<Task['status'], string> = {
  pending: 'border-l-yellow-400',
  scheduled: 'border-l-blue-400',
  completed: 'border-l-green-400',
  cancelled: 'border-l-gray-300',
}

export function TaskCard({ task }: TaskCardProps) {
  const setActiveFeedbackTaskId = useCalendarStore((s) => s.setActiveFeedbackTaskId)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setActiveFeedbackTaskId(task.id)}
      onKeyDown={(e) => e.key === 'Enter' && setActiveFeedbackTaskId(task.id)}
      className={cn(
        'border-l-4 bg-white rounded-r-md shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow',
        statusColors[task.status]
      )}
    >
      <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
      {task.scheduledDate !== undefined && (
        <p className="text-xs text-gray-500 mt-0.5">{formatTime(task.scheduledDate)}</p>
      )}
      {task.duration !== undefined && (
        <p className="text-xs text-gray-400">{task.duration} min</p>
      )}
    </div>
  )
}
