import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAppStore } from './store/useAppStore'
import { fetchSchedule } from './api/client'
import { GoalInput } from './components/GoalInput/GoalInput'
import { CalendarGrid } from './components/Calendar/CalendarGrid'
import { TaskDetail } from './components/TaskCard/TaskDetail'
import { ProgressBar } from './components/Calendar/ProgressBar'
import { Header } from './components/Header'

const queryClient = new QueryClient()

function AppContent() {
  const activeGoalId = useAppStore((s) => s.activeGoalId)
  const schedules = useAppStore((s) => s.schedules)
  const setSchedule = useAppStore((s) => s.setSchedule)
  const setActiveGoalId = useAppStore((s) => s.setActiveGoalId)
  const selectedTaskId = useAppStore((s) => s.selectedTaskId)
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId)

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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedTaskId !== null) {
        setSelectedTaskId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedTaskId, setSelectedTaskId])

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
      <Header />

      <main style={{ padding: '16px' }}>
        <ProgressBar schedule={activeSchedule} />
        <CalendarGrid schedule={activeSchedule} />
      </main>

      <TaskDetail />
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
