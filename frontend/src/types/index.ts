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
}
