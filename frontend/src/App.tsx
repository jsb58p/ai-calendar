import { useEffect, useRef, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAppStore } from './store/useAppStore'
import { fetchSchedule, fetchGoals, syncAllTasks, getMe } from './api/client'
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
import { GoogleConnectPrompt } from './components/GoogleConnectPrompt'
import { LoginPage } from './components/Auth/LoginPage'
import { EmailVerified } from './components/Auth/EmailVerified'

const queryClient = new QueryClient()

function AppContent() {
  const [isRehydrating, setIsRehydrating] = useState(
    () => !!localStorage.getItem('activeGoalId')
  )
  const [showGooglePrompt, setShowGooglePrompt] = useState(false)

  const authLoading      = useAppStore((s) => s.authLoading)
  const isAuthenticated  = useAppStore((s) => s.isAuthenticated)
  const setCurrentUser   = useAppStore((s) => s.setCurrentUser)
  const setAuthLoading   = useAppStore((s) => s.setAuthLoading)
  const activeGoalId     = useAppStore((s) => s.activeGoalId)
  const schedules        = useAppStore((s) => s.schedules)
  const setSchedule      = useAppStore((s) => s.setSchedule)
  const setActiveGoalId  = useAppStore((s) => s.setActiveGoalId)
  const googleTokens     = useAppStore((s) => s.googleTokens)
  const setGoogleTokens  = useAppStore((s) => s.setGoogleTokens)
  const hasSeenGooglePrompt   = useAppStore((s) => s.hasSeenGooglePrompt)
  const setHasSeenGooglePrompt = useAppStore((s) => s.setHasSeenGooglePrompt)
  const setGoals         = useAppStore((s) => s.setGoals)
  const updateSettings   = useAppStore((s) => s.updateSettings)
  const toastMessage     = useAppStore((s) => s.toastMessage)
  const setToastMessage  = useAppStore((s) => s.setToastMessage)
  const toastDiffs       = useAppStore((s) => s.toastDiffs)
  const setToastDiffs    = useAppStore((s) => s.setToastDiffs)
  const selectedTaskId   = useAppStore((s) => s.selectedTaskId)
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId)
  const isSettingsPanelOpen  = useAppStore((s) => s.isSettingsPanelOpen)
  const setSettingsPanelOpen = useAppStore((s) => s.setSettingsPanelOpen)

  const prevActiveGoalIdRef = useRef(activeGoalId)

  // ── Auth check (runs once on mount) ────────────────────────────────────────
  useEffect(() => {
    getMe()
      .then(({ user }) => setCurrentUser(user))
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthLoading(false))
  }, [setCurrentUser, setAuthLoading])

  // ── Restore Google Calendar OAuth tokens ───────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (access_token && refresh_token) {
      const tokens = { access_token, refresh_token }
      setGoogleTokens(tokens)
      localStorage.setItem('googleTokens', JSON.stringify(tokens))
      window.history.replaceState({}, '', window.location.pathname)

      const currentGoalId = useAppStore.getState().activeGoalId
      if (currentGoalId) {
        syncAllTasks(currentGoalId, tokens).catch(console.error)
      }
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

  // ── Persist flags ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (localStorage.getItem('hasSeenGooglePrompt') === 'true') {
      setHasSeenGooglePrompt(true)
    }
  }, [setHasSeenGooglePrompt])

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

  // ── Data loading (only when authenticated) ─────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return
    fetchGoals()
      .then(({ goals }) => setGoals(goals))
      .catch(() => { /* non-critical */ })
  }, [isAuthenticated, setGoals])

  useEffect(() => {
    if (!isAuthenticated) return
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
  }, [isAuthenticated, setSchedule, setActiveGoalId])

  // ── Detect fresh goal submission → auto-sync / show Google prompt ──────────
  useEffect(() => {
    const prev = prevActiveGoalIdRef.current
    prevActiveGoalIdRef.current = activeGoalId

    if (prev === null && activeGoalId !== null && !isRehydrating) {
      if (googleTokens === null && !hasSeenGooglePrompt) {
        setShowGooglePrompt(true)
      } else if (googleTokens !== null) {
        syncAllTasks(activeGoalId, googleTokens).catch(console.error)
      }
    }
  }, [activeGoalId, isRehydrating, googleTokens, hasSeenGooglePrompt])

  // ── Keyboard shortcut: Escape closes task detail ───────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedTaskId !== null) {
        setSelectedTaskId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedTaskId, setSelectedTaskId])

  function handleCloseGooglePrompt() {
    setShowGooglePrompt(false)
    setHasSeenGooglePrompt(true)
    localStorage.setItem('hasSeenGooglePrompt', 'true')
  }

  // ── Route resolution ───────────────────────────────────────────────────────
  const path = window.location.pathname

  if (authLoading) {
    return (
      <div
        data-testid="auth-loading"
        className="min-h-screen bg-bg-base flex items-center justify-center"
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="animate-spin-slow rounded-full border-t-accent mx-auto"
            style={{
              width: '32px',
              height: '32px',
              border: '2px solid rgba(99,102,241,0.2)',
              borderTopColor: '#6366f1',
              marginBottom: '12px',
            }}
          />
          <p className="text-text-secondary" style={{ fontSize: '14px' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (path === '/verified') {
    return <EmailVerified />
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  // ── Authenticated app ──────────────────────────────────────────────────────
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
      <GoogleConnectPrompt isOpen={showGooglePrompt} onClose={handleCloseGooglePrompt} />
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
