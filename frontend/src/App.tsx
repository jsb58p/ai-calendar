import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAppStore } from './store/useAppStore'
import { fetchSchedule } from './api/client'
import { GoalInput } from './components/GoalInput/GoalInput'

const queryClient = new QueryClient()

function AppContent() {
  const activeGoalId = useAppStore((s) => s.activeGoalId)
  const schedules = useAppStore((s) => s.schedules)
  const setSchedule = useAppStore((s) => s.setSchedule)
  const setActiveGoalId = useAppStore((s) => s.setActiveGoalId)
  const clearActiveGoal = useAppStore((s) => s.clearActiveGoal)

  useEffect(() => {
    const savedId = localStorage.getItem('activeGoalId')
    if (!savedId) return
    fetchSchedule(savedId)
      .then((schedule) => {
        setSchedule(schedule)
        setActiveGoalId(savedId)
      })
      .catch(() => {
        localStorage.removeItem('activeGoalId')
      })
  }, [setSchedule, setActiveGoalId])

  const activeSchedule = activeGoalId ? (schedules[activeGoalId] ?? null) : null

  if (activeSchedule === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <GoalInput />
      </div>
    )
  }

  return (
    <div>
      <div data-testid="calendar-placeholder">Calendar coming soon</div>
      <button
        onClick={() => {
          clearActiveGoal()
          localStorage.removeItem('activeGoalId')
        }}
      >
        Change Goal
      </button>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
