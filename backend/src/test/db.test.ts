import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { GoalInput, Schedule, Task, FeedbackEntry } from '../models/types'

// Replace JSONFile with lowdb's in-memory adapter so no db.json is written.
// Memory ignores its constructor argument, so new JSONFile(path) becomes
// new Memory(path) — the path is silently discarded.
// Each initDb() call creates a fresh Low + new Memory instance → clean slate.
vi.mock('lowdb/node', async () => {
  const { Memory } = await import('lowdb')
  return { JSONFile: Memory }
})

import {
  initDb,
  saveGoal,
  getGoal,
  saveSchedule,
  getSchedule,
  saveFeedback,
  getFeedbackForSchedule,
} from '../services/db'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const GOAL: GoalInput = {
  id: 'g1',
  title: 'Learn TypeScript',
  description: 'Complete a TypeScript course and build a project',
  targetDate: '2026-09-01',
  createdAt: '2026-06-13T00:00:00.000Z',
}

const TASK: Task = {
  id: 't1',
  goalId: 'g1',
  title: 'Read the handbook',
  description: 'Work through the official TypeScript handbook',
  scheduledDate: '2026-06-20',
  estimatedMinutes: 60,
  status: 'pending',
  stepInstructions: ['Open handbook', 'Read chapter 1', 'Take notes'],
}

const SCHEDULE: Schedule = {
  goalId: 'g1',
  tasks: [TASK],
}

function makeFeedback(id: string, overrides?: Partial<FeedbackEntry>): FeedbackEntry {
  return {
    id,
    scheduleId: 'g1',
    rating: 4,
    notes: 'Feeling good about the pace',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('db service', () => {
  beforeEach(async () => {
    // Re-initialise creates a new Low<DBSchema> with a fresh Memory adapter
    await initDb()
  })

  it('saveGoal then getGoal returns the same object', async () => {
    await saveGoal(GOAL)
    const result = await getGoal(GOAL.id)
    expect(result).toEqual(GOAL)
  })

  it('saveSchedule then getSchedule returns the same object', async () => {
    await saveSchedule(SCHEDULE)
    const result = await getSchedule(SCHEDULE.goalId)
    expect(result).toEqual(SCHEDULE)
  })

  it('getSchedule with an unknown goalId returns undefined and does not throw', async () => {
    const result = await getSchedule('does-not-exist')
    expect(result).toBeUndefined()
  })

  it('saveFeedback then getFeedbackForSchedule returns an array containing the entry', async () => {
    const entry = makeFeedback('fb1')
    await saveFeedback(entry)
    const results = await getFeedbackForSchedule(entry.scheduleId)
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual(entry)
  })

  it('multiple feedback entries for the same scheduleId are all returned', async () => {
    const entry1 = makeFeedback('fb1', { rating: 5, notes: 'Great pace' })
    const entry2 = makeFeedback('fb2', { rating: 2, notes: 'Too hard' })
    await saveFeedback(entry1)
    await saveFeedback(entry2)
    const results = await getFeedbackForSchedule('g1')
    expect(results).toHaveLength(2)
    expect(results.map((f) => f.id)).toContain('fb1')
    expect(results.map((f) => f.id)).toContain('fb2')
  })
})
