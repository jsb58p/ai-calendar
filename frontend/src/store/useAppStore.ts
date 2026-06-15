import { create } from 'zustand'
import type { GoalInput, Schedule, FeedbackEntry, Task, UserSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import type { DiffEntry } from '../utils/diff'
import type { CurrentUser } from '../api/client'

interface AppState {
  currentUser: CurrentUser | null
  isAuthenticated: boolean
  authLoading: boolean
  goals: GoalInput[]
  schedules: Record<string, Schedule>
  feedback: FeedbackEntry[]
  activeGoalId: string | null
  selectedDate: Date
  selectedTaskId: string | null
  isLoading: boolean
  error: string | null
  isFeedbackModalOpen: boolean
  googleTokens: { access_token: string; refresh_token: string } | null
  toastMessage: string | null
  toastDiffs: DiffEntry[]
  isHistoryPanelOpen: boolean
  isSettingsPanelOpen: boolean
  isGoalSwitcherOpen: boolean
  isAdminPanelOpen: boolean
  settings: UserSettings
  hasSeenGooglePrompt: boolean
}

interface AppActions {
  setCurrentUser: (user: CurrentUser | null) => void
  logout: () => void
  setAuthLoading: (v: boolean) => void
  addGoal: (goal: GoalInput) => void
  setSchedule: (schedule: Schedule) => void
  addFeedback: (entry: FeedbackEntry) => void
  setActiveGoalId: (id: string | null) => void
  setSelectedDate: (date: Date) => void
  setSelectedTaskId: (id: string | null) => void
  setLoading: (v: boolean) => void
  setError: (msg: string | null) => void
  clearError: () => void
  setFeedbackModalOpen: (v: boolean) => void
  setGoogleTokens: (tokens: { access_token: string; refresh_token: string } | null) => void
  updateTaskStatus: (taskId: string, status: Task['status']) => void
  clearActiveGoal: () => void
  setToastMessage: (msg: string | null) => void
  setToastDiffs: (diffs: DiffEntry[]) => void
  setGoals: (goals: GoalInput[]) => void
  setHistoryPanelOpen: (v: boolean) => void
  setSettingsPanelOpen: (v: boolean) => void
  setGoalSwitcherOpen: (v: boolean) => void
  setAdminPanelOpen: (v: boolean) => void
  removeGoal: (goalId: string) => void
  updateSettings: (patch: Partial<UserSettings>) => void
  resetSettings: () => void
  updateTaskSteps: (taskId: string, completedSteps: number[]) => void
  setHasSeenGooglePrompt: (v: boolean) => void
}

export const useAppStore = create<AppState & AppActions>()((set) => ({
  currentUser: null,
  isAuthenticated: false,
  authLoading: true,
  goals: [],
  schedules: {},
  feedback: [],
  activeGoalId: null,
  selectedDate: new Date(),
  selectedTaskId: null,
  isLoading: false,
  error: null,
  isFeedbackModalOpen: false,
  googleTokens: null,
  toastMessage: null,
  toastDiffs: [],
  isHistoryPanelOpen: false,
  isSettingsPanelOpen: false,
  isGoalSwitcherOpen: false,
  isAdminPanelOpen: false,
  settings: DEFAULT_SETTINGS,
  hasSeenGooglePrompt: false,

  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: user !== null }),

  logout: () => {
    localStorage.removeItem('googleTokens')
    localStorage.removeItem('userSettings')
    localStorage.removeItem('auth_token')
    set({
      currentUser: null,
      isAuthenticated: false,
      goals: [],
      schedules: {},
      feedback: [],
      activeGoalId: null,
      googleTokens: null,
      settings: DEFAULT_SETTINGS,
      selectedTaskId: null,
      toastMessage: null,
      toastDiffs: [],
    })
  },

  setAuthLoading: (authLoading) => set({ authLoading }),

  addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),

  setSchedule: (schedule) =>
    set((s) => ({ schedules: { ...s.schedules, [schedule.goalId]: schedule } })),

  addFeedback: (entry) => set((s) => ({ feedback: [...s.feedback, entry] })),

  setActiveGoalId: (activeGoalId) => set({ activeGoalId }),

  setSelectedDate: (selectedDate) => set({ selectedDate }),

  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  setFeedbackModalOpen: (isFeedbackModalOpen) => set({ isFeedbackModalOpen }),

  setGoogleTokens: (googleTokens) => set({ googleTokens }),

  updateTaskStatus: (taskId, status) =>
    set((s) => {
      const updatedSchedules: Record<string, Schedule> = {}
      let changed = false

      for (const [goalId, schedule] of Object.entries(s.schedules)) {
        const taskIndex = schedule.tasks.findIndex((t) => t.id === taskId)
        if (taskIndex === -1) {
          updatedSchedules[goalId] = schedule
        } else {
          const updatedTasks = schedule.tasks.map((t) =>
            t.id === taskId ? { ...t, status } : t
          )
          updatedSchedules[goalId] = { ...schedule, tasks: updatedTasks }
          changed = true
        }
      }

      return changed ? { schedules: updatedSchedules } : s
    }),

  clearActiveGoal: () => set({ activeGoalId: null }),

  setToastMessage: (toastMessage) => set({ toastMessage }),

  setToastDiffs: (toastDiffs) => set({ toastDiffs }),

  setGoals: (goals) => set({ goals }),

  setHistoryPanelOpen: (isHistoryPanelOpen) => set({ isHistoryPanelOpen }),

  setSettingsPanelOpen: (isSettingsPanelOpen) => set({ isSettingsPanelOpen }),

  setGoalSwitcherOpen: (isGoalSwitcherOpen) => set({ isGoalSwitcherOpen }),
  setAdminPanelOpen: (isAdminPanelOpen) => set({ isAdminPanelOpen }),

  removeGoal: (goalId) =>
    set((s) => {
      const newSchedules = { ...s.schedules }
      delete newSchedules[goalId]
      return {
        goals: s.goals.filter((g) => g.id !== goalId),
        schedules: newSchedules,
        activeGoalId: s.activeGoalId === goalId ? null : s.activeGoalId,
      }
    }),

  updateSettings: (patch) =>
    set((s) => {
      const next = { ...s.settings, ...patch }
      localStorage.setItem('userSettings', JSON.stringify(next))
      return { settings: next }
    }),

  resetSettings: () => {
    set({ settings: DEFAULT_SETTINGS })
    localStorage.setItem('userSettings', JSON.stringify(DEFAULT_SETTINGS))
  },

  setHasSeenGooglePrompt: (hasSeenGooglePrompt) => set({ hasSeenGooglePrompt }),

  updateTaskSteps: (taskId, completedSteps) =>
    set((s) => {
      const updatedSchedules: Record<string, Schedule> = {}
      let changed = false

      for (const [goalId, schedule] of Object.entries(s.schedules)) {
        const taskIndex = schedule.tasks.findIndex((t) => t.id === taskId)
        if (taskIndex === -1) {
          updatedSchedules[goalId] = schedule
        } else {
          const updatedTasks = schedule.tasks.map((t) =>
            t.id === taskId ? { ...t, completedSteps } : t
          )
          updatedSchedules[goalId] = { ...schedule, tasks: updatedTasks }
          changed = true
        }
      }

      return changed ? { schedules: updatedSchedules } : s
    }),
}))
