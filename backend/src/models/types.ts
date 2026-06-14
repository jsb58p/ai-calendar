export interface GoalInput {
  id: string
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

export interface DBSchema {
  goals: GoalInput[]
  schedules: Schedule[]
  feedback: FeedbackEntry[]
  settings: Record<string, UserSettings>
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
  timezone: 'UTC',
}
