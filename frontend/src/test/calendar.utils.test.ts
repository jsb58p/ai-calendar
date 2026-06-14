import { describe, it, expect } from 'vitest'
import {
  getDaysInMonth,
  getStartDayOfWeek,
  isSameDayUtil,
  getTasksForDate,
} from '../utils/calendar'
import type { Task } from '../types'

function makeTask(id: string, scheduledDate: string): Task {
  return {
    id,
    goalId: 'goal-1',
    title: `Task ${id}`,
    description: 'desc',
    scheduledDate,
    estimatedMinutes: 30,
    status: 'pending',
    stepInstructions: ['step 1'],
  }
}

describe('getDaysInMonth', () => {
  it('returns 28 items for February 2025 (non-leap year)', () => {
    expect(getDaysInMonth(2025, 1)).toHaveLength(28)
  })

  it('returns 29 items for February 2024 (leap year)', () => {
    expect(getDaysInMonth(2024, 1)).toHaveLength(29)
  })
})

describe('getStartDayOfWeek', () => {
  it('returns 0 (Sunday) for June 2025 — June 1 is a Sunday', () => {
    expect(getStartDayOfWeek(new Date(2025, 5, 1))).toBe(0)
  })
})

describe('isSameDayUtil', () => {
  it('returns true for the same calendar day', () => {
    expect(isSameDayUtil(new Date(2025, 5, 15, 9, 0), new Date(2025, 5, 15, 23, 59))).toBe(true)
  })

  it('returns false for different calendar days', () => {
    expect(isSameDayUtil(new Date(2025, 5, 15), new Date(2025, 5, 16))).toBe(false)
  })
})

describe('getTasksForDate', () => {
  const tasks = [
    makeTask('a', '2025-06-15'),
    makeTask('b', '2025-06-15'),
    makeTask('c', '2025-06-16'),
  ]

  it('returns only tasks matching the given date', () => {
    const result = getTasksForDate(tasks, new Date(2025, 5, 15))
    expect(result).toHaveLength(2)
    expect(result.map((t) => t.id)).toEqual(['a', 'b'])
  })

  it('returns empty array when task list is empty', () => {
    expect(getTasksForDate([], new Date(2025, 5, 15))).toEqual([])
  })

  it('does not return tasks on different dates', () => {
    const result = getTasksForDate(tasks, new Date(2025, 5, 17))
    expect(result).toHaveLength(0)
  })
})
