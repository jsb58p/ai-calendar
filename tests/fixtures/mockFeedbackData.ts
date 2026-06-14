import type { GoalInput, Schedule } from '../../frontend/src/types'
import { mockSchedule } from './mockSchedule'

function utcDatePlusDays(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Goal whose id matches the localStorage key used in the feedback test
export const mockFeedbackGoal: GoalInput = {
  id: 'mock-goal-id',
  title: 'Learn TypeScript',
  description: 'Master TypeScript fundamentals in 30 days',
  targetDate: utcDatePlusDays(30),
  createdAt: new Date().toISOString(),
}

// Re-use the tasks from the shared fixture but rebind them to 'mock-goal-id'
// so setSchedule stores under the key that activeGoalId points at.
const reboundTasks = mockSchedule.tasks.map((t) => ({ ...t, goalId: 'mock-goal-id' }))

export const feedbackSchedule: Schedule = {
  goalId: 'mock-goal-id',
  tasks: reboundTasks,
}

// Same tasks as feedbackSchedule, but the first two are moved to later dates —
// computeDiff will detect them as 'rescheduled' and the toast will show the diffs.
export const mockAdaptedSchedule: Schedule = {
  goalId: 'mock-goal-id',
  tasks: reboundTasks.map((task, i) =>
    i < 2 ? { ...task, scheduledDate: utcDatePlusDays(10 + i) } : task
  ),
}
