import { create } from 'zustand'
import type { GoalInput, Schedule, FeedbackEntry, Task } from '../types'

interface AppState {
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
}

interface AppActions {
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
}

export const useAppStore = create<AppState & AppActions>()((set) => ({
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
}))
