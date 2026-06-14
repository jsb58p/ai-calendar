import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { GoalInput, Schedule, FeedbackEntry } from '../models/types'

// vi.hoisted runs before vi.mock factories, making mockCreate available in the closure
const mockCreate = vi.hoisted(() => vi.fn())

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate }
  },
}))

// Import AFTER vi.mock so the module receives the mocked Anthropic constructor
const { generateSchedule, adaptSchedule } = await import('../services/anthropic')

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_GOAL: GoalInput = {
  id: 'goal-1',
  title: 'Run a 5K',
  description: 'Train consistently to complete a 5K race',
  targetDate: '2026-08-15',
  createdAt: '2026-06-13T00:00:00.000Z',
}

const MOCK_TASK = {
  id: 'task-1',
  goalId: 'goal-1',
  title: 'Easy jog',
  description: 'Warm-up jog to build the habit',
  scheduledDate: '2026-06-20',
  estimatedMinutes: 30,
  status: 'pending',
  stepInstructions: ['Lace up shoes', 'Stretch for 5 min', 'Jog at easy pace'],
  googleCalendarEventId: null,
}

const MOCK_SCHEDULE: Schedule = {
  goalId: 'goal-1',
  tasks: [MOCK_TASK],
}

const MOCK_ADAPTED = {
  ...MOCK_SCHEDULE,
  changesExplained: 'Reduced session length based on feedback rating of 2.',
}

const MOCK_FEEDBACK: FeedbackEntry = {
  id: 'fb-1',
  scheduleId: 'goal-1',
  rating: 2,
  notes: 'Too intense — please reduce the daily workout time',
  createdAt: '2026-06-13T00:00:00.000Z',
}

function fakeResponse(text: string) {
  return { content: [{ type: 'text', text }] }
}

// ---------------------------------------------------------------------------
// generateSchedule
// ---------------------------------------------------------------------------

describe('generateSchedule', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockCreate.mockResolvedValue(fakeResponse(JSON.stringify(MOCK_SCHEDULE)))
  })

  it('returns an object with goalId matching the input goal id', async () => {
    const result = await generateSchedule(MOCK_GOAL)
    expect(result.goalId).toBe(MOCK_GOAL.id)
  })

  it('returns tasks array with at least 1 item', async () => {
    const result = await generateSchedule(MOCK_GOAL)
    expect(result.tasks.length).toBeGreaterThanOrEqual(1)
  })

  it('every task has all 9 required Task fields', async () => {
    const result = await generateSchedule(MOCK_GOAL)
    for (const task of result.tasks) {
      expect(task).toHaveProperty('id')
      expect(task).toHaveProperty('goalId')
      expect(task).toHaveProperty('title')
      expect(task).toHaveProperty('description')
      expect(task).toHaveProperty('scheduledDate')
      expect(task).toHaveProperty('estimatedMinutes')
      expect(task).toHaveProperty('status')
      expect(task).toHaveProperty('stepInstructions')
      // googleCalendarEventId is optional but must be a recognised key when present
      expect(Object.keys(task)).toContain('googleCalendarEventId')
    }
  })

  it('throws when the Anthropic SDK throws — does not swallow the error', async () => {
    mockCreate.mockRejectedValue(new Error('API unavailable'))
    await expect(generateSchedule(MOCK_GOAL)).rejects.toThrow('API unavailable')
  })

  it('throws a descriptive error when Claude returns invalid JSON', async () => {
    mockCreate.mockResolvedValue(fakeResponse('not valid json {{{'))
    await expect(generateSchedule(MOCK_GOAL)).rejects.toThrow(/failed to parse/i)
  })
})

// ---------------------------------------------------------------------------
// adaptSchedule
// ---------------------------------------------------------------------------

describe('adaptSchedule', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockCreate.mockResolvedValue(fakeResponse(JSON.stringify(MOCK_ADAPTED)))
  })

  it('returns an object with a non-empty changesExplained string', async () => {
    const result = await adaptSchedule(MOCK_SCHEDULE, MOCK_FEEDBACK)
    expect(typeof result.changesExplained).toBe('string')
    expect(result.changesExplained.length).toBeGreaterThan(0)
  })
})
