import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { fetchSchedule, deleteGoal } from '../../api/client'
import { Modal, Button } from '../ui'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function GoalSwitcher({ isOpen, onClose }: Props) {
  const goals          = useAppStore((s) => s.goals)
  const schedules      = useAppStore((s) => s.schedules)
  const activeGoalId   = useAppStore((s) => s.activeGoalId)
  const setActiveGoalId = useAppStore((s) => s.setActiveGoalId)
  const setSchedule    = useAppStore((s) => s.setSchedule)
  const clearActiveGoal = useAppStore((s) => s.clearActiveGoal)
  const removeGoal     = useAppStore((s) => s.removeGoal)

  const [openingId, setOpeningId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sortedGoals = [...goals].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  async function handleOpen(goalId: string) {
    setOpeningId(goalId)
    try {
      if (!schedules[goalId]) {
        const schedule = await fetchSchedule(goalId)
        setSchedule(schedule)
      }
      setActiveGoalId(goalId)
      localStorage.setItem('activeGoalId', goalId)
      onClose()
    } catch {
      // ignore — user can retry
    } finally {
      setOpeningId(null)
    }
  }

  async function handleDelete(goalId: string) {
    setDeletingId(goalId)
    try {
      await deleteGoal(goalId)
      removeGoal(goalId)
      if (goalId === activeGoalId) {
        localStorage.removeItem('activeGoalId')
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  function handleNewGoal() {
    clearActiveGoal()
    localStorage.removeItem('activeGoalId')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="My Goals"
      panelTestId="goal-switcher-panel"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Button
          data-testid="new-goal-button"
          variant="primary"
          className="w-full"
          onClick={handleNewGoal}
        >
          + New Goal
        </Button>

        {sortedGoals.length === 0 ? (
          <p
            data-testid="goal-switcher-empty"
            style={{ color: '#64748b', textAlign: 'center', fontSize: '14px', padding: '24px 0' }}
          >
            No goals yet. Create your first goal to get started.
          </p>
        ) : (
          sortedGoals.map((goal) => {
            const schedule = schedules[goal.id]
            const completedCount = schedule
              ? schedule.tasks.filter((t) => t.status === 'complete').length
              : 0
            const totalCount = schedule ? schedule.tasks.length : 0
            const isActive = goal.id === activeGoalId

            const targetDate = new Date(goal.targetDate).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric',
            })
            const createdDate = new Date(goal.createdAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })

            return (
              <div
                key={goal.id}
                data-testid="goal-switcher-item"
                style={{
                  background: isActive ? '#1a1a2e' : '#22222e',
                  border: `1px solid ${isActive ? '#6366f1' : '#2a2a3a'}`,
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {goal.title}
                    </p>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0 0' }}>
                      Target: {targetDate}
                    </p>
                    <p style={{ color: '#4a5568', fontSize: '11px', margin: '2px 0 0 0' }}>
                      Created {createdDate}
                    </p>
                  </div>
                  {schedule && totalCount > 0 && (
                    <span style={{
                      background: '#1a1a2e',
                      border: '1px solid #2a2a3a',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      color: '#9090aa',
                      fontSize: '11px',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}>
                      {completedCount}/{totalCount} tasks
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {isActive ? (
                    <span style={{ color: '#6366f1', fontSize: '12px' }}>Active</span>
                  ) : (
                    <Button
                      data-testid="goal-open-button"
                      variant="secondary"
                      size="sm"
                      loading={openingId === goal.id}
                      onClick={() => handleOpen(goal.id)}
                    >
                      Open
                    </Button>
                  )}
                  <Button
                    data-testid="goal-delete-button"
                    variant="danger"
                    size="sm"
                    loading={deletingId === goal.id}
                    onClick={() => handleDelete(goal.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </Modal>
  )
}
