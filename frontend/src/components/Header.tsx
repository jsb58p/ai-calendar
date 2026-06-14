import { useAppStore } from '../store/useAppStore'
import { getGoogleAuthUrl } from '../api/client'
import { Button, Badge } from './ui'

export function Header() {
  const activeGoalId = useAppStore((s) => s.activeGoalId)
  const goals = useAppStore((s) => s.goals)
  const schedules = useAppStore((s) => s.schedules)
  const googleTokens = useAppStore((s) => s.googleTokens)
  const setFeedbackModalOpen = useAppStore((s) => s.setFeedbackModalOpen)
  const clearActiveGoal = useAppStore((s) => s.clearActiveGoal)
  const isHistoryPanelOpen = useAppStore((s) => s.isHistoryPanelOpen)
  const setHistoryPanelOpen = useAppStore((s) => s.setHistoryPanelOpen)

  const activeGoal = goals.find((g) => g.id === activeGoalId) ?? null
  const activeSchedule = activeGoalId ? (schedules[activeGoalId] ?? null) : null
  const completedCount = activeSchedule ? activeSchedule.tasks.filter((t) => t.status === 'complete').length : 0
  const totalCount = activeSchedule ? activeSchedule.tasks.length : 0

  return (
    <header
      data-testid="header"
      className="fixed top-0 left-0 right-0 z-40 bg-bg-surface/80 backdrop-blur-md border-b border-border-default h-14 flex items-center px-6 gap-4"
    >
      {/* Left: brand */}
      <div className="flex items-center flex-shrink-0">
        <span
          data-testid="app-name"
          className="font-mono text-text-primary font-semibold text-lg tracking-tight"
        >
          Calendr.ai
        </span>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent ml-0.5 mb-1" />
      </div>

      {/* Center: goal title + completion count */}
      <div className="flex-1 flex justify-center items-center gap-2">
        {activeGoal && (
          <>
            <span
              data-testid="goal-title"
              className="text-text-secondary text-sm truncate max-w-xs"
            >
              {activeGoal.title}
            </span>
            {activeSchedule && totalCount > 0 && (
              <Badge variant="default">
                {completedCount}/{totalCount}
              </Badge>
            )}
          </>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          data-testid="history-button"
          variant="ghost"
          size="sm"
          onClick={() => setHistoryPanelOpen(!isHistoryPanelOpen)}
        >
          ⏱ History
        </Button>

        {activeGoal !== null && (
          <Button
            data-testid="give-feedback-button"
            variant="secondary"
            size="sm"
            onClick={() => setFeedbackModalOpen(true)}
          >
            Give Feedback
          </Button>
        )}

        {googleTokens === null && activeGoal !== null && (
          <Button
            data-testid="google-connect-button"
            variant="ghost"
            size="sm"
            className="text-info"
            onClick={() => { window.location.href = getGoogleAuthUrl() }}
          >
            Connect Google Calendar
          </Button>
        )}

        {googleTokens !== null && (
          <Badge data-testid="google-connected-indicator" variant="info">
            📅 Synced
          </Badge>
        )}

        {activeGoal !== null && (
          <Button
            data-testid="change-goal-button"
            variant="ghost"
            size="sm"
            className="text-text-muted"
            onClick={() => {
              clearActiveGoal()
              localStorage.removeItem('activeGoalId')
            }}
          >
            Change Goal
          </Button>
        )}
      </div>
    </header>
  )
}
