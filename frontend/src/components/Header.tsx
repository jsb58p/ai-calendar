import { useAppStore } from '../store/useAppStore'
import { getGoogleAuthUrl } from '../api/client'

export function Header() {
  const activeGoalId = useAppStore((s) => s.activeGoalId)
  const goals = useAppStore((s) => s.goals)
  const googleTokens = useAppStore((s) => s.googleTokens)
  const setFeedbackModalOpen = useAppStore((s) => s.setFeedbackModalOpen)
  const clearActiveGoal = useAppStore((s) => s.clearActiveGoal)

  const activeGoal = goals.find((g) => g.id === activeGoalId) ?? null

  return (
    <header
      data-testid="header"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        gap: '12px',
      }}
    >
      <span
        data-testid="app-name"
        style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px', flexShrink: 0 }}
      >
        Calendr.ai
      </span>

      <span
        data-testid="goal-title"
        style={{
          flex: 1,
          textAlign: 'center',
          fontWeight: 500,
          fontSize: '15px',
          color: '#374151',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '40%',
          margin: '0 auto',
          display: activeGoal ? 'block' : 'none',
        }}
      >
        {activeGoal?.title ?? ''}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
        {googleTokens !== null && (
          <span
            data-testid="google-connected-indicator"
            style={{ fontSize: '13px', color: '#16a34a' }}
          >
            📅 Google Calendar Connected
          </span>
        )}

        {googleTokens === null && activeGoal !== null && (
          <button
            data-testid="google-connect-button"
            onClick={() => { window.location.href = getGoogleAuthUrl() }}
            style={{
              fontSize: '13px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #3b82f6',
              backgroundColor: 'transparent',
              color: '#3b82f6',
              cursor: 'pointer',
            }}
          >
            Connect Google Calendar
          </button>
        )}

        {activeGoal !== null && (
          <button
            data-testid="give-feedback-button"
            onClick={() => setFeedbackModalOpen(true)}
            style={{
              fontSize: '13px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #8b5cf6',
              backgroundColor: 'transparent',
              color: '#8b5cf6',
              cursor: 'pointer',
            }}
          >
            Give Feedback
          </button>
        )}

        {activeGoal !== null && (
          <button
            data-testid="change-goal-button"
            onClick={() => {
              clearActiveGoal()
              localStorage.removeItem('activeGoalId')
            }}
            style={{
              fontSize: '13px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: 'transparent',
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            Change Goal
          </button>
        )}
      </div>
    </header>
  )
}
