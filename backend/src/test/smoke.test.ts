import { describe, it, expect } from 'vitest'
import type { GoalInput, Task, AdaptedSchedule } from '../models/types'

describe('types: GoalInput', () => {
  it('exports GoalInput with all 6 required fields', () => {
    const goal: GoalInput = {
      id: '1',
      userId: 'u1',
      title: 'Run a 5K',
      description: 'Train for a 5K race',
      targetDate: '2026-09-01',
      createdAt: new Date().toISOString(),
    }
    expect(goal).toHaveProperty('id')
    expect(goal).toHaveProperty('userId')
    expect(goal).toHaveProperty('title')
    expect(goal).toHaveProperty('description')
    expect(goal).toHaveProperty('targetDate')
    expect(goal).toHaveProperty('createdAt')
  })
})

describe('types: Task', () => {
  it('exports Task with all 9 fields (googleCalendarEventId optional)', () => {
    const task: Task = {
      id: '1',
      goalId: 'g1',
      title: 'Morning run',
      description: 'Run 2 miles at an easy pace',
      scheduledDate: '2026-07-01T07:00:00.000Z',
      estimatedMinutes: 30,
      status: 'pending',
      stepInstructions: ['Warm up for 5 min', 'Run 2 miles', 'Cool down'],
    }
    expect(task).toHaveProperty('id')
    expect(task).toHaveProperty('goalId')
    expect(task).toHaveProperty('title')
    expect(task).toHaveProperty('description')
    expect(task).toHaveProperty('scheduledDate')
    expect(task).toHaveProperty('estimatedMinutes')
    expect(task).toHaveProperty('status')
    expect(task).toHaveProperty('stepInstructions')
    // googleCalendarEventId is optional — confirm it's absent when not set
    expect(task.googleCalendarEventId).toBeUndefined()
  })
})

describe('types: AdaptedSchedule', () => {
  it('has a changesExplained field extending Schedule', () => {
    const adapted: AdaptedSchedule = {
      goalId: 'g1',
      tasks: [],
      changesExplained: 'Moved Tuesday session to Wednesday due to rest day.',
    }
    expect(adapted).toHaveProperty('goalId')
    expect(adapted).toHaveProperty('tasks')
    expect(adapted).toHaveProperty('changesExplained')
    expect(typeof adapted.changesExplained).toBe('string')
  })
})
