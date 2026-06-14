import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { submitGoal } from '../../api/client'
import { Skeleton } from '../Skeleton'

function getTomorrowDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().substring(0, 10)
}

export function GoalInput() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')

  const isLoading = useAppStore((s) => s.isLoading)
  const error = useAppStore((s) => s.error)
  const setLoading = useAppStore((s) => s.setLoading)
  const setError = useAppStore((s) => s.setError)
  const clearError = useAppStore((s) => s.clearError)
  const addGoal = useAppStore((s) => s.addGoal)
  const setSchedule = useAppStore((s) => s.setSchedule)
  const setActiveGoalId = useAppStore((s) => s.setActiveGoalId)

  const isDisabled = isLoading || !title.trim() || !description.trim() || !targetDate

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { goal, schedule } = await submitGoal({ title, description, targetDate })
      addGoal(goal)
      setSchedule(schedule)
      setActiveGoalId(goal.id)
      localStorage.setItem('activeGoalId', goal.id)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <h1 data-testid="goal-input-heading">What&apos;s your goal?</h1>
        <Skeleton className="h-10 w-full mb-3" />
        <Skeleton className="h-24 w-full mb-3" />
        <Skeleton className="h-10 w-48 mb-6" />
        <div
          data-testid="loading-spinner"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '3px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto',
          }}
        />
      </div>
    )
  }

  return (
    <div>
      <h1 data-testid="goal-input-heading">What&apos;s your goal?</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="title">Goal title</label>
          <input
            id="title"
            data-testid="title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            placeholder="e.g. Learn to play guitar in 3 months"
          />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            data-testid="description-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={500}
            placeholder="Describe your goal in more detail..."
            rows={4}
          />
        </div>

        <div>
          <label htmlFor="targetDate">Target date</label>
          <input
            id="targetDate"
            data-testid="date-input"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
            min={getTomorrowDate()}
          />
        </div>

        <button
          data-testid="submit-button"
          type="submit"
          disabled={isDisabled}
        >
          Generate My Schedule →
        </button>
      </form>

      {error !== null && (
        <div data-testid="error-banner">
          {error}
          <button data-testid="clear-error-button" aria-label="Dismiss error" onClick={clearError} type="button">
            ×
          </button>
        </div>
      )}
    </div>
  )
}
