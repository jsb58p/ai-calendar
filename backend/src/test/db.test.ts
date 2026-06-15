import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { GoalInput, Schedule, Task, FeedbackEntry } from '../models/types'

// Shared in-memory store — hoisted so it's accessible inside the vi.mock factory
const store = vi.hoisted((): Record<string, any[]> => ({}))

vi.mock('mongodb', () => {
  function get(name: string): any[] {
    if (!store[name]) store[name] = []
    return store[name]
  }

  function project(doc: any, projection?: Record<string, 0 | 1>): any {
    if (!projection) return { ...doc }
    const out = { ...doc }
    for (const [k, v] of Object.entries(projection)) {
      if (v === 0) delete out[k]
    }
    return out
  }

  function match(doc: any, filter: Record<string, any>): boolean {
    return Object.entries(filter).every(([k, v]) => doc[k] === v)
  }

  class MockCollection {
    private name: string
    constructor(name: string) {
      this.name = name
    }

    createIndex() {
      return Promise.resolve('idx')
    }

    async findOne(filter: any, opts?: { projection?: Record<string, 0 | 1> }) {
      const found = get(this.name).find((d) => match(d, filter))
      return found ? project(found, opts?.projection) : null
    }

    find(filter: any, opts?: { projection?: Record<string, 0 | 1> }) {
      return {
        toArray: async () => {
          const coll = get(this.name)
          const hits =
            Object.keys(filter).length === 0
              ? coll
              : coll.filter((d) => match(d, filter))
          return hits.map((d) => project(d, opts?.projection))
        },
      }
    }

    async replaceOne(filter: any, doc: any, opts?: { upsert?: boolean }) {
      const coll = get(this.name)
      const idx = coll.findIndex((d) => match(d, filter))
      if (idx !== -1) coll[idx] = { ...doc }
      else if (opts?.upsert) coll.push({ ...doc })
      return {}
    }

    async insertOne(doc: any) {
      get(this.name).push({ ...doc })
      return { insertedId: 'mock' }
    }
  }

  class MockDb {
    collection(name: string) {
      return new MockCollection(name)
    }
  }

  class MockMongoClient {
    connect() {
      return Promise.resolve()
    }
    db() {
      return new MockDb()
    }
  }

  return { MongoClient: MockMongoClient }
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
    Object.keys(store).forEach((k) => {
      delete store[k]
    })
    process.env['MONGODB_URI'] = 'mongodb://localhost/test'
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
