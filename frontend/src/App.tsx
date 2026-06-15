import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAppStore } from './store/useAppStore'
import { fetchSchedule, fetchGoals } from './api/client'
import { GoalInput } from './components/GoalInput/GoalInput'
import { CalendarGrid } from './components/Calendar/CalendarGrid'
import { CalendarSkeleton } from './components/Calendar/CalendarSkeleton'
import { TaskDetail } from './components/TaskCard/TaskDetail'
import { ProgressBar } from './components/Calendar/ProgressBar'
import { Header } from './components/Header'
import { FeedbackModal } from './components/FeedbackModal/FeedbackModal'
import { HistoryPanel } from './components/FeedbackModal/HistoryPanel'
import { ScheduleChanges } from './components/FeedbackModal/ScheduleChanges'
import { Toast } from './components/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SettingsPanel } from './components/Settings/SettingsPanel'

const queryClient = new QueryClient()

function AppContent() {
  // True only when the app first loads with a saved goal ID in localStorage.
  // Initialized synchronously so the very first render skips the GoalInput flash.
  const [isRehydrating, setIsRehydrating] = useState(
    () => !!localStorage.getItem('activeGoalId')
  )

  const activeGoalId = useAppStore((s) => s.activeGoalId)
  const schedules = useAppStore((s) => s.schedules)
  const setSchedule = useAppStore((s) => s.setSchedule)
  const setActiveGoalId = useAppStore((s) => s.setActiveGoalId)
  const setGoogleTokens = useAppStore((s) => s.setGoogleTokens)
  const setGoals = useAppStore((s) => s.setGoals)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const toastMessage = useAppStore((s) => s.toastMessage)
  const setToastMessage = useAppStore((s) => s.setToastMessage)
  const toastDiffs = useAppStore((s) => s.toastDiffs)
  const setToastDiffs = useAppStore((s) => s.setToastDiffs)
  const selectedTaskId = useAppStore((s) => s.selectedTaskId)
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId)
  const isSettingsPanelOpen = useAppStore((s) => s.isSettingsPanelOpen)
  const setSettingsPanelOpen = useAppStore((s) => s.setSettingsPanelOpen)

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
    const saved = localStorage.getItem('userSettings')
    if (saved) {
      try {
        updateSettings(JSON.parse(saved))
      } catch {
        localStorage.removeItem('userSettings')
      }
    }
  }, [updateSettings])

  useEffect(() => {
    fetchGoals()
      .then(({ goals }) => setGoals(goals))
      .catch(() => { /* non-critical — goals will repopulate on next goal submit */ })
  }, [setGoals])

  useEffect(() => {
    const savedId = localStorage.getItem('activeGoalId')
    if (!savedId) {
      setIsRehydrating(false)
      return
    }
    fetchSchedule(savedId)
      .then((schedule) => {
        setSchedule(schedule)
        setActiveGoalId(savedId)
      })
      .catch(() => {
        localStorage.removeItem('activeGoalId')
      })
      .finally(() => {
        setIsRehydrating(false)
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

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col">
      {isRehydrating ? (
        <div className="flex-1 p-6 animate-pulse-slow">
          <CalendarSkeleton />
        </div>
      ) : activeSchedule === null ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <GoalInput />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />

          {/* explicit spacer so content starts below the fixed h-14 header */}
          <div className="h-14 flex-shrink-0" />

          <ProgressBar schedule={activeSchedule} />

          <main className="flex-1 flex flex-col overflow-hidden">
            {activeSchedule.tasks.length === 0 ? (
              <div
                data-testid="empty-schedule"
                className="flex-1 flex items-center justify-center p-8 text-center text-text-muted text-sm"
              >
                No tasks scheduled yet. Your schedule may still be generating — try refreshing in a moment.
              </div>
            ) : (
              <CalendarGrid schedule={activeSchedule} />
            )}
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
      )}
      <SettingsPanel isOpen={isSettingsPanelOpen} onClose={() => setSettingsPanelOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
