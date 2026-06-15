import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { submitGoal } from '../../api/client'
import { Input, Textarea, Button } from '../ui'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getTomorrowDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().substring(0, 10)
}

function formatDaysString(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b)
  const isConsecutive =
    sorted.length > 1 && sorted.every((d, i) => i === 0 || d === sorted[i - 1]! + 1)
  if (isConsecutive) {
    return `${DAY_NAMES[sorted[0]!]}–${DAY_NAMES[sorted[sorted.length - 1]!]}`
  }
  return sorted.map((d) => DAY_NAMES[d]!).join('·')
}

function formatTime(t: string): string {
  const [h, m] = t.split(':')
  return `${parseInt(h!, 10)}:${m}`
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
  const settings = useAppStore((s) => s.settings)
  const setSettingsPanelOpen = useAppStore((s) => s.setSettingsPanelOpen)

  const isDisabled = isLoading || !title.trim() || !description.trim() || !targetDate

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { goal, schedule } = await submitGoal({ title, description, targetDate, settings })
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

  const settingsSummary = [
    formatDaysString(settings.availableDays),
    `${formatTime(settings.dailyStartTime)}–${formatTime(settings.dailyEndTime)}`,
    `${settings.minTaskDuration}–${settings.maxTaskDuration} min tasks`,
  ].join(' · ')

  if (isLoading) {
    return (
      <div
        data-testid="loading-spinner"
        className="fixed inset-0 z-[200] bg-bg-base flex flex-col items-center justify-center gap-6"
      >
        <div className="w-16 h-16 rounded-full border-4 border-bg-muted border-t-accent animate-spin-slow" />
        <p className="text-text-primary text-xl font-semibold">Generating your schedule...</p>
        <p className="text-text-muted text-sm font-mono">This may take a few seconds</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <p className="text-accent font-mono text-xs font-medium tracking-widest uppercase mb-2">
          NEW GOAL
        </p>
        <h1
          data-testid="goal-input-heading"
          className="text-text-primary text-3xl font-semibold mb-1"
        >
          What&apos;s your goal?
        </h1>
        <p className="text-text-secondary text-sm">
          Describe it in plain language. We&apos;ll handle the rest.
        </p>
      </div>

      {/* Settings preview strip */}
      <div className="bg-bg-surface border border-border-default rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
        <span className="text-text-muted text-xs font-mono">{settingsSummary}</span>
        <Button variant="ghost" size="sm" onClick={() => setSettingsPanelOpen(true)}>
          Edit
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Goal title"
          id="title"
          data-testid="title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
          placeholder="e.g. Develop an app in a week"
        />

        <Textarea
          label="Describe your goal"
          id="description"
          data-testid="description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={500}
          placeholder="Describe your goal in more detail..."
          rows={4}
        />

        <Input
          label="Target date"
          id="targetDate"
          data-testid="date-input"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          required
          min={getTomorrowDate()}
        />

        {error !== null && (
          <div
            data-testid="error-banner"
            className="bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 text-danger text-sm flex items-start justify-between gap-3"
          >
            <span>
              {error}
              {/api key|authentication/i.test(error) && (
                <div data-testid="api-key-hint" className="text-xs mt-1 opacity-80">
                  Check that your ANTHROPIC_API_KEY is set correctly in backend/.env
                </div>
              )}
            </span>
            <button
              data-testid="clear-error-button"
              aria-label="Dismiss error"
              onClick={clearError}
              type="button"
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        )}

        <Button
          data-testid="submit-button"
          variant="primary"
          size="lg"
          type="submit"
          className="w-full mt-2"
          disabled={isDisabled}
        >
          Generate My Schedule →
        </Button>
      </form>
    </div>
  )
}
