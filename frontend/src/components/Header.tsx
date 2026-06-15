import { useAppStore } from '../store/useAppStore'
import { getGoogleAuthUrl } from '../api/client'


export function Header() {
  const activeGoalId = useAppStore((s) => s.activeGoalId)
  const goals = useAppStore((s) => s.goals)
  const schedules = useAppStore((s) => s.schedules)
  const googleTokens = useAppStore((s) => s.googleTokens)
  const setFeedbackModalOpen = useAppStore((s) => s.setFeedbackModalOpen)
  const clearActiveGoal = useAppStore((s) => s.clearActiveGoal)
  const isHistoryPanelOpen = useAppStore((s) => s.isHistoryPanelOpen)
  const setHistoryPanelOpen = useAppStore((s) => s.setHistoryPanelOpen)
  const setSettingsPanelOpen = useAppStore((s) => s.setSettingsPanelOpen)
  const setGoogleTokens = useAppStore((s) => s.setGoogleTokens)

  const activeGoal = goals.find((g) => g.id === activeGoalId) ?? null
  const activeSchedule = activeGoalId ? (schedules[activeGoalId] ?? null) : null
  const completedCount = activeSchedule ? activeSchedule.tasks.filter((t) => t.status === 'complete').length : 0
  const totalCount = activeSchedule ? activeSchedule.tasks.length : 0
  const percentComplete = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <header
      data-testid="header"
      className="fixed top-0 left-0 right-0 z-40 bg-bg-surface/80 backdrop-blur-md border-b border-border-default h-14 flex items-center gap-4"
      style={{ paddingLeft: '24px', paddingRight: '24px' }}
    >
      {activeSchedule && totalCount > 0 && (
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-accent transition-all duration-700"
          style={{ width: `${percentComplete}%` }}
        />
      )}

      {/* Left: brand */}
      <div className="flex items-center flex-shrink-0">
        <span
          data-testid="app-name"
          className="font-mono text-text-primary font-semibold text-lg tracking-tight"
        >
          SchedulerAI
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
      <div className="flex-shrink-0" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          data-testid="settings-button"
          onClick={() => setSettingsPanelOpen(true)}
          aria-label="Settings"
          style={{ background: '#22222e', border: '1px solid #2a2a3a', borderRadius: '6px', padding: '6px 10px', color: '#9090aa', cursor: 'pointer' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a3a' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#22222e' }}
        >
          ⚙
        </button>

        <button
          data-testid="history-button"
          onClick={() => setHistoryPanelOpen(!isHistoryPanelOpen)}
          style={{ background: '#22222e', border: '1px solid #2a2a3a', borderRadius: '6px', padding: '6px 10px', color: '#9090aa', cursor: 'pointer' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a3a' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#22222e' }}
        >
          ⏱ History
        </button>

        {activeGoal !== null && (
          <button
            data-testid="give-feedback-button"
            onClick={() => setFeedbackModalOpen(true)}
            style={{ background: '#1a1a24', border: '1px solid #6366f1', borderRadius: '6px', padding: '6px 14px', color: '#f0f0ff', cursor: 'pointer', fontSize: '14px' }}
          >
            Give Feedback
          </button>
        )}

        {googleTokens === null && activeGoal !== null && (
          <button
            data-testid="google-connect-button"
            onClick={() => { window.location.href = getGoogleAuthUrl() }}
            style={{ background: 'transparent', border: '1px solid #2a2a3a', borderRadius: '6px', padding: '6px 12px', color: '#38bdf8', cursor: 'pointer', fontSize: '14px' }}
          >
            Connect Google Calendar
          </button>
        )}

        {googleTokens !== null && (
          <span
            data-testid="google-connected-indicator"
            style={{ color: '#22c55e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            📅 Calendar Synced
            <button
              onClick={() => {
                setGoogleTokens(null)
                localStorage.removeItem('googleTokens')
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a72', fontSize: '12px', padding: '0 0 0 4px' }}
            >
              Disconnect
            </button>
          </span>
        )}

        {activeGoal !== null && (
          <button
            data-testid="change-goal-button"
            onClick={() => {
              clearActiveGoal()
              localStorage.removeItem('activeGoalId')
            }}
            style={{ background: 'transparent', border: 'none', padding: '6px 12px', color: '#5a5a72', cursor: 'pointer', fontSize: '14px' }}
          >
            Change Goal
          </button>
        )}
      </div>
    </header>
  )
}
