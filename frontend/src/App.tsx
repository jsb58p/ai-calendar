import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAppStore } from './store/useAppStore'
import { fetchSchedule, fetchGoals } from './api/client'
import { GoalInput } from './components/GoalInput/GoalInput'
import { CalendarGrid } from './components/Calendar/CalendarGrid'
import { TaskDetail } from './components/TaskCard/TaskDetail'
import { ProgressBar } from './components/Calendar/ProgressBar'
import { Header } from './components/Header'
import { FeedbackModal } from './components/FeedbackModal/FeedbackModal'
import { HistoryPanel } from './components/FeedbackModal/HistoryPanel'
import { ScheduleChanges } from './components/FeedbackModal/ScheduleChanges'
import { Toast } from './components/Toast'

const queryClient = new QueryClient()

function AppContent() {
  const activeGoalId = useAppStore((s) => s.activeGoalId)
  const schedules = useAppStore((s) => s.schedules)
  const setSchedule = useAppStore((s) => s.setSchedule)
  const setActiveGoalId = useAppStore((s) => s.setActiveGoalId)
  const setGoogleTokens = useAppStore((s) => s.setGoogleTokens)
  const setGoals = useAppStore((s) => s.setGoals)
  const toastMessage = useAppStore((s) => s.toastMessage)
  const setToastMessage = useAppStore((s) => s.setToastMessage)
  const toastDiffs = useAppStore((s) => s.toastDiffs)
  const setToastDiffs = useAppStore((s) => s.setToastDiffs)
  const selectedTaskId = useAppStore((s) => s.selectedTaskId)
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId)

  // Restore persisted tokens and handle OAuth redirect-back with tokens in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (access_token && refresh_token) {
      const tokens = { access_token, refresh_token }
      setGoogleTokens(tokens)
      localStorage.setItem('googleTokens', JSON.stringify(tokens))
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    const saved = localStorage.getItem('googleTokens')
    if (saved) {
      try {
        setGoogleTokens(JSON.parse(saved) as { access_token: string; refresh_token: string })
      } catch {
        localStorage.removeItem('googleTokens')
      }
    }
  }, [setGoogleTokens])

  useEffect(() => {
    fetchGoals()
      .then(({ goals }) => setGoals(goals))
      .catch(() => { /* non-critical — goals will repopulate on next goal submit */ })
  }, [setGoals])

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
      <FeedbackModal />
      <HistoryPanel />
      <Toast
        message={toastMessage}
        onDismiss={() => { setToastMessage(null); setToastDiffs([]) }}
      >
        <ScheduleChanges diffs={toastDiffs} />
      </Toast>
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
