import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { useAppStore } from '../../store/useAppStore'
import { syncTaskToCalendar, updateTaskStatus as apiUpdateTaskStatus } from '../../api/client'
import type { Task } from '../../types'

const statusBadgeClass: Record<Task['status'], string> = {
  complete: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  skipped: 'bg-gray-100 text-gray-600',
}

export function TaskDetail() {
  const selectedTaskId = useAppStore((s) => s.selectedTaskId)
  const schedules = useAppStore((s) => s.schedules)
  const googleTokens = useAppStore((s) => s.googleTokens)
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId)
  const updateTaskStatus = useAppStore((s) => s.updateTaskStatus)

  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set())
  const [syncing, setSyncing] = useState(false)

  // Reset local step state when the selected task changes
  useEffect(() => {
    setCheckedSteps(new Set())
  }, [selectedTaskId])

  if (selectedTaskId === null) return null

  const task = Object.values(schedules)
    .flatMap((s) => s.tasks)
    .find((t) => t.id === selectedTaskId) ?? null

  if (task === null) return null

  function toggleStep(index: number) {
    setCheckedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
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
      data-testid="task-detail-panel"
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        width: '400px',
        backgroundColor: '#fff',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        zIndex: 50,
        overflowY: 'auto',
        padding: '24px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <h2 data-testid="detail-title" style={{ fontSize: '18px', fontWeight: 700, flex: 1, marginRight: '12px' }}>
          {task.title}
        </h2>
        <button
          data-testid="close-button"
          aria-label="Close task detail"
          onClick={() => setSelectedTaskId(null)}
          style={{ fontSize: '20px', lineHeight: 1, padding: '4px 8px', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      {/* Meta */}
      <p data-testid="detail-date" style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
        {formattedDate}
      </p>
      <p data-testid="detail-time" style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
        Estimated: {task.estimatedMinutes} minutes
      </p>

      <span
        data-testid="detail-status-badge"
        className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${statusBadgeClass[task.status]}`}
        style={{ marginBottom: '20px' }}
      >
        {task.status}
      </span>

      {/* Step-by-step instructions */}
      <h3
        data-testid="step-instructions"
        style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', marginTop: '16px' }}
      >
        Step-by-Step Instructions
      </h3>
      <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0' }}>
        {task.stepInstructions.map((step, index) => (
          <li
            key={index}
            data-testid={`step-item-${index}`}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}
          >
            <input
              type="checkbox"
              checked={checkedSteps.has(index)}
              onChange={() => toggleStep(index)}
              style={{ marginTop: '2px', flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: '13px',
                color: '#374151',
                textDecoration: checkedSteps.has(index) ? 'line-through' : 'none',
              }}
            >
              {index + 1}. {step}
            </span>
          </li>
        ))}
      </ol>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          data-testid="mark-complete-button"
          disabled={task.status === 'complete'}
          onClick={() => {
            updateTaskStatus(task.id, 'complete')
            persistStatus(task.id, 'complete')
            setSelectedTaskId(null)
          }}
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: task.status === 'complete' ? '#d1fae5' : '#22c55e',
            color: task.status === 'complete' ? '#6b7280' : '#fff',
            cursor: task.status === 'complete' ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          Mark Complete
        </button>

        <button
          data-testid="mark-incomplete-button"
          disabled={task.status === 'pending'}
          onClick={() => { updateTaskStatus(task.id, 'pending'); persistStatus(task.id, 'pending') }}
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            backgroundColor: task.status === 'pending' ? '#f3f4f6' : '#fff',
            color: task.status === 'pending' ? '#9ca3af' : '#374151',
            cursor: task.status === 'pending' ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          Mark Incomplete
        </button>

        <button
          data-testid="skip-button"
          disabled={task.status === 'skipped'}
          onClick={() => { updateTaskStatus(task.id, 'skipped'); persistStatus(task.id, 'skipped') }}
          style={{
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ef4444',
            backgroundColor: 'transparent',
            color: task.status === 'skipped' ? '#9ca3af' : '#ef4444',
            borderColor: task.status === 'skipped' ? '#d1d5db' : '#ef4444',
            cursor: task.status === 'skipped' ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          Skip Task
        </button>

        {googleTokens !== null && (
          <button
            data-testid="sync-calendar-button"
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #3b82f6',
              backgroundColor: syncing ? '#eff6ff' : 'transparent',
              color: '#3b82f6',
              cursor: syncing ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {syncing ? 'Syncing…' : 'Sync to Google Calendar'}
          </button>
        )}
      </div>
    </div>
  )
}
