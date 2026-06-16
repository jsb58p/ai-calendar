import { create } from 'zustand'
import type { GoalInput, Schedule, FeedbackEntry, Task, UserSettings, CurrentUser } from '../types'
import { DEFAULT_SETTINGS } from '../types'

interface AppState {
  currentUser: CurrentUser | null
  isAuthenticated: boolean
  authLoading: boolean
  goals: GoalInput[]
  schedules: Record<string, Schedule>
  feedback: FeedbackEntry[]
  activeGoalId: string | null
  selectedTaskId: string | null
  settings: UserSettings
  googleTokens: { access_token: string; refresh_token: string } | null
  isGoalSwitcherOpen: boolean
  isAdminPanelOpen: boolean
  toastMessage: string | null
}

interface AppActions {
  setCurrentUser: (user: CurrentUser | null) => void
  logout: () => void
  setAuthLoading: (v: boolean) => void
  addGoal: (goal: GoalInput) => void
  setGoals: (goals: GoalInput[]) => void
  setSchedule: (schedule: Schedule) => void
  removeGoal: (goalId: string) => void
  updateTaskStatus: (taskId: string, status: Task['status']) => void
  updateTaskSteps: (taskId: string, completedSteps: number[]) => void
  setActiveGoalId: (id: string | null) => void
  clearActiveGoal: () => void
  setSelectedTaskId: (id: string | null) => void
  updateSettings: (patch: Partial<UserSettings>) => void
  resetSettings: () => void
  setGoogleTokens: (tokens: { access_token: string; refresh_token: string } | null) => void
  setGoalSwitcherOpen: (v: boolean) => void
  setAdminPanelOpen: (v: boolean) => void
  setToastMessage: (msg: string | null) => void
}

export const useAppStore = create<AppState & AppActions>()((set) => ({
  currentUser: null,
  isAuthenticated: false,
  authLoading: true,
  goals: [],
  schedules: {},
  feedback: [],
  activeGoalId: null,
  selectedTaskId: null,
  settings: DEFAULT_SETTINGS,
  googleTokens: null,
  isGoalSwitcherOpen: false,
  isAdminPanelOpen: false,
  toastMessage: null,

  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: user !== null }),

  logout: () =>
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
    }),

  setAuthLoading: (authLoading) => set({ authLoading }),

  addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),

  setGoals: (goals) => set({ goals }),

  setSchedule: (schedule) =>
    set((s) => ({ schedules: { ...s.schedules, [schedule.goalId]: schedule } })),

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

  updateTaskStatus: (taskId, status) =>
    set((s) => {
      const updatedSchedules: Record<string, Schedule> = {}
      let changed = false

      for (const [goalId, schedule] of Object.entries(s.schedules)) {
        const taskIndex = schedule.tasks.findIndex((t) => t.id === taskId)
        if (taskIndex === -1) {
          updatedSchedules[goalId] = schedule
        } else {
          updatedSchedules[goalId] = {
            ...schedule,
            tasks: schedule.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
          }
          changed = true
        }
      }

      return changed ? { schedules: updatedSchedules } : s
    }),

  updateTaskSteps: (taskId, completedSteps) =>
    set((s) => {
      const updatedSchedules: Record<string, Schedule> = {}
      let changed = false

      for (const [goalId, schedule] of Object.entries(s.schedules)) {
        const taskIndex = schedule.tasks.findIndex((t) => t.id === taskId)
        if (taskIndex === -1) {
          updatedSchedules[goalId] = schedule
        } else {
          updatedSchedules[goalId] = {
            ...schedule,
            tasks: schedule.tasks.map((t) => (t.id === taskId ? { ...t, completedSteps } : t)),
          }
          changed = true
        }
      }

      return changed ? { schedules: updatedSchedules } : s
    }),

  setActiveGoalId: (activeGoalId) => set({ activeGoalId }),

  clearActiveGoal: () => set({ activeGoalId: null }),

  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),

  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

  resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

  setGoogleTokens: (googleTokens) => set({ googleTokens }),

  setGoalSwitcherOpen: (isGoalSwitcherOpen) => set({ isGoalSwitcherOpen }),

  setAdminPanelOpen: (isAdminPanelOpen) => set({ isAdminPanelOpen }),

  setToastMessage: (toastMessage) => set({ toastMessage }),
}))
