export interface GoalInput {
  id: string
  userId: string
  title: string
  description: string
  targetDate: string
  createdAt: string
}

export interface Task {
  id: string
  goalId: string
  title: string
  description: string
  scheduledDate: string
  estimatedMinutes: number
  status: 'pending' | 'complete' | 'skipped'
  stepInstructions: string[]
  completedSteps?: number[]
  googleCalendarEventId?: string
}

export interface Schedule {
  goalId: string
  tasks: Task[]
}

export interface FeedbackEntry {
  id: string
  scheduleId: string
  rating: 1 | 2 | 3 | 4 | 5
  notes: string
  createdAt: string
}

export interface AdaptedSchedule extends Schedule {
  changesExplained: string
}

export interface UserSettings {
  availableDays: number[]
  dailyStartTime: string
  dailyEndTime: string
  minTaskDuration: number
  maxTaskDuration: number
  difficultyRamp: 'flat' | 'easy-to-hard' | 'hard-to-easy'
  weeklyReviewDay: number
  blackoutDates: string[]
  timezone: string
}

export const DEFAULT_SETTINGS: UserSettings = {
  availableDays: [1, 2, 3, 4, 5],
  dailyStartTime: '09:00',
  dailyEndTime: '17:00',
  minTaskDuration: 15,
  maxTaskDuration: 120,
  difficultyRamp: 'easy-to-hard',
  weeklyReviewDay: 0,
  blackoutDates: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
}

export type CurrentUser = {
  id: string
  email: string
  displayName: string
  emailVerified: boolean
  isAdmin?: boolean
}

export type AdminUser = {
  id: string
  email: string
  displayName: string
  emailVerified: boolean
  isAdmin?: boolean
  suspended?: boolean
  createdAt: string
  goalCount: number
}
