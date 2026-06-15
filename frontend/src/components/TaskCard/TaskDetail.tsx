import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { format, parseISO } from 'date-fns'
import { useAppStore } from '../../store/useAppStore'
import { syncTaskToCalendar, updateTaskStatus as apiUpdateTaskStatus, updateStepCompletion } from '../../api/client'
import type { Task } from '../../types'
import { Button, Badge } from '../ui'

const statusBadgeVariant: Record<Task['status'], 'success' | 'warning' | 'default'> = {
  complete: 'success',
  pending:  'warning',
  skipped:  'default',
}

export function TaskDetail() {
  const selectedTaskId    = useAppStore((s) => s.selectedTaskId)
  const schedules         = useAppStore((s) => s.schedules)
  const googleTokens      = useAppStore((s) => s.googleTokens)
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId)
  const updateTaskStatus  = useAppStore((s) => s.updateTaskStatus)
  const updateTaskSteps   = useAppStore((s) => s.updateTaskSteps)
  const setHistoryPanelOpen = useAppStore((s) => s.setHistoryPanelOpen)

  const [syncing, setSyncing] = useState(false)

  // Mutual exclusion: close HistoryPanel when a task is selected
  useEffect(() => {
    if (selectedTaskId !== null) setHistoryPanelOpen(false)
  }, [selectedTaskId, setHistoryPanelOpen])

  if (selectedTaskId === null) return null

  const task = Object.values(schedules)
    .flatMap((s) => s.tasks)
    .find((t) => t.id === selectedTaskId) ?? null

  if (task === null) return null

  function toggleStep(index: number) {
    const current = task.completedSteps ?? []
    const newSteps = current.includes(index)
      ? current.filter((i) => i !== index)
      : [...current, index]
    updateTaskSteps(task.id, newSteps)
    const goalId = Object.entries(schedules).find(([, s]) => s.tasks.some((t) => t.id === task.id))?.[0]
    if (goalId) {
      updateStepCompletion(goalId, task.id, newSteps).catch(console.error)
    }
  }

  function persistStatus(taskId: string, status: Task['status']) {
    const goalId = Object.entries(schedules).find(([, s]) => s.tasks.some((t) => t.id === taskId))?.[0]
    if (goalId) {
      apiUpdateTaskStatus(goalId, taskId, status).catch(console.error)
    }
  }

  async function handleSync() {
    if (!googleTokens || !task) return
    setSyncing(true)
    try {
      await syncTaskToCalendar(task.id, googleTokens)
    } finally {
      setSyncing(false)
    }
  }

  const formattedDate = format(parseISO(task.scheduledDate), 'EEEE, MMMM d, yyyy')

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={() => setSelectedTaskId(null)}
    >
      <div
        data-testid="task-detail-panel"
        className="bg-bg-surface border border-border-default rounded-xl shadow-elevated w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-border-default flex-shrink-0">
        <h2 data-testid="detail-title" className="text-text-primary font-semibold text-lg leading-snug pr-4">
          {task.title}
        </h2>
        <Button
          data-testid="close-button"
          variant="ghost"
          size="sm"
          aria-label="Close task detail"
          onClick={() => setSelectedTaskId(null)}
        >
          ✕
        </Button>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 px-6 py-3 bg-bg-elevated border-b border-border-default">
        <span data-testid="detail-date" className="font-mono text-xs text-text-secondary">
          {formattedDate}
        </span>
        <span data-testid="detail-time" className="font-mono text-xs text-text-muted">
          Estimated: {task.estimatedMinutes} minutes
        </span>
        <Badge
          data-testid="detail-status-badge"
          variant={statusBadgeVariant[task.status]}
        >
          {task.status}
        </Badge>
      </div>

      {/* Steps section */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <p
          data-testid="step-instructions"
          className="text-text-secondary text-xs font-mono uppercase tracking-wider mb-4"
        >
          Step-by-Step Instructions
        </p>
        <ol className="list-none p-0 m-0">
          {task.stepInstructions.map((step, index) => (
            <li
              key={index}
              data-testid={`step-item-${index}`}
              className="flex gap-3 mb-4 items-start"
            >
              <input
                type="checkbox"
                checked={task.completedSteps?.includes(index) ?? false}
                onChange={() => toggleStep(index)}
                className="w-4 h-4 rounded-sm border border-border-default bg-bg-muted checked:bg-accent flex-shrink-0 mt-0.5 cursor-pointer"
              />
              <div className={(task.completedSteps?.includes(index) ?? false) ? 'line-through text-text-muted' : ''}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="text-text-primary text-sm leading-relaxed">{children}</p>,
                    strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="text-text-secondary italic">{children}</em>,
                    h1: ({ children }) => <h1 className="text-white font-bold text-base mb-1">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-white font-semibold text-sm mb-1">{children}</h2>,
                    code: ({ children }) => <code className="bg-bg-muted text-accent font-mono text-xs px-1.5 py-0.5 rounded">{children}</code>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 text-text-primary text-sm">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 text-text-primary text-sm">{children}</ol>,
                    li: ({ children }) => <li className="text-text-primary text-sm">{children}</li>,
                  }}
                >
                  {step}
                </ReactMarkdown>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Action bar */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-border-default bg-bg-elevated flex flex-col gap-2">
        <Button
          data-testid="mark-complete-button"
          variant="primary"
          className="w-full"
          disabled={task.status === 'complete'}
          onClick={() => {
            updateTaskStatus(task.id, 'complete')
            persistStatus(task.id, 'complete')
            setSelectedTaskId(null)
          }}
        >
          Mark Complete
        </Button>

        <div className="flex gap-2">
          <Button
            data-testid="mark-incomplete-button"
            variant="secondary"
            className="flex-1"
            disabled={task.status === 'pending'}
            onClick={() => { updateTaskStatus(task.id, 'pending'); persistStatus(task.id, 'pending') }}
          >
            Mark Incomplete
          </Button>
          <Button
            data-testid="skip-button"
            variant="danger"
            className="flex-1"
            disabled={task.status === 'skipped'}
            onClick={() => { updateTaskStatus(task.id, 'skipped'); persistStatus(task.id, 'skipped') }}
          >
            Skip Task
          </Button>
        </div>

        {googleTokens !== null && (
          <Button
            data-testid="sync-calendar-button"
            variant="ghost"
            size="sm"
            className="w-full text-info"
            disabled={syncing}
            onClick={handleSync}
          >
            {syncing ? 'Syncing…' : 'Sync to Google Calendar'}
          </Button>
        )}
      </div>
      </div>
    </div>
  )
}
