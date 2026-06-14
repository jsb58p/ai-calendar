import { create } from 'zustand'
import type { Goal, Task, AppView } from '../types'

interface CalendarStore {
  goals: Goal[]
  tasks: Task[]
  selectedDate: Date
  currentView: AppView
  activeFeedbackTaskId: string | null

  setGoals: (goals: Goal[]) => void
  addGoal: (goal: Goal) => void
  removeGoal: (id: string) => void
  setTasks: (tasks: Task[]) => void
  setSelectedDate: (date: Date) => void
  setCurrentView: (view: AppView) => void
  setActiveFeedbackTaskId: (id: string | null) => void
}

export const useCalendarStore = create<CalendarStore>()((set) => ({
  goals: [],
  tasks: [],
  selectedDate: new Date(),
  currentView: 'week',
  activeFeedbackTaskId: null,

  setGoals: (goals) => set({ goals }),
  addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),
  removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
  setTasks: (tasks) => set({ tasks }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setCurrentView: (currentView) => set({ currentView }),
  setActiveFeedbackTaskId: (activeFeedbackTaskId) => set({ activeFeedbackTaskId }),
}))
