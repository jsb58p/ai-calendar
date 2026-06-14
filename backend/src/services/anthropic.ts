import type { GoalInput, Schedule } from '../models/types'

// Stub — Anthropic SDK will be wired in a future block
export async function generateSchedule(_goal: GoalInput): Promise<Schedule> {
  return {
    goalId: _goal.id,
    tasks: [],
  }
}
