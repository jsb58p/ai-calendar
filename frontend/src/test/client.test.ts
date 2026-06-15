import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { GoalInput, Schedule } from '../types'
import { DEFAULT_SETTINGS } from '../types'

// ---------------------------------------------------------------------------
// axios.create() is called at module-load time inside client.ts, so the mock
// must be fully in place before that import resolves.  vi.hoisted() runs
// before any import, vi.mock() factory closes over the hoisted value.
// ---------------------------------------------------------------------------

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
  },
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockApi),
    // mirrors real axios.isAxiosError: checks the sentinel property
    isAxiosError: (err: unknown): boolean =>
      typeof err === 'object' &&
      err !== null &&
      (err as Record<string, unknown>).isAxiosError === true,
  },
}))

import {
  submitGoal,
  fetchSchedule,
  fetchGoals,
  submitFeedback,
  updateTaskStatus,
  getGoogleAuthUrl,
  syncTaskToCalendar,
} from '../api/client'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_GOAL: GoalInput = {
  id: 'goal-1',
  userId: 'user-1',
  title: 'Learn Guitar',
  description: 'Practice daily',
  targetDate: '2026-12-31',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const MOCK_SCHEDULE: Schedule = {
  goalId: 'goal-1',
  tasks: [],
}

// ---------------------------------------------------------------------------
// Helper: build an object that looks like an AxiosError to extractMessage()
// ---------------------------------------------------------------------------

function makeAxiosError(status: number, errorMessage: string) {
  return Object.assign(new Error('Request failed'), {
    isAxiosError: true,
    response: { status, data: { error: errorMessage } },
  })
}

// ---------------------------------------------------------------------------
// Reset mocks between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('API client', () => {
  // --- submitGoal -----------------------------------------------------------

  it('1: submitGoal calls POST to /goals with correct body', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { goal: MOCK_GOAL, schedule: MOCK_SCHEDULE } })
    const body = { title: 'Learn Guitar', description: 'Practice daily', targetDate: '2026-12-31', settings: DEFAULT_SETTINGS }
    await submitGoal(body)
    expect(mockApi.post).toHaveBeenCalledWith('/goals', body)
  })

  it('2: submitGoal returns { goal, schedule } from response.data', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { goal: MOCK_GOAL, schedule: MOCK_SCHEDULE } })
    const result = await submitGoal({ title: 'Learn Guitar', description: 'Practice daily', targetDate: '2026-12-31', settings: DEFAULT_SETTINGS })
    expect(result).toEqual({ goal: MOCK_GOAL, schedule: MOCK_SCHEDULE })
  })

  it('3: submitGoal throws a user-friendly Error when response is 400', async () => {
    mockApi.post.mockRejectedValueOnce(makeAxiosError(400, 'Goal title is required'))
    await expect(
      submitGoal({ title: '', description: '', targetDate: '', settings: DEFAULT_SETTINGS })
    ).rejects.toThrow('Goal title is required')
  })

  // --- fetchSchedule --------------------------------------------------------

  it('4: fetchSchedule calls GET to /goals/{goalId}/schedule', async () => {
    mockApi.get.mockResolvedValueOnce({ data: MOCK_SCHEDULE })
    await fetchSchedule('goal-1')
    expect(mockApi.get).toHaveBeenCalledWith('/goals/goal-1/schedule')
  })

  it('5: fetchSchedule returns the schedule from response.data', async () => {
    mockApi.get.mockResolvedValueOnce({ data: MOCK_SCHEDULE })
    const result = await fetchSchedule('goal-1')
    expect(result).toEqual(MOCK_SCHEDULE)
  })

  it('6: fetchSchedule throws with a user-friendly message on 404', async () => {
    mockApi.get.mockRejectedValueOnce(makeAxiosError(404, 'Schedule not found'))
    await expect(fetchSchedule('unknown-goal')).rejects.toThrow('Schedule not found')
  })

  // --- submitFeedback -------------------------------------------------------

  it('7: submitFeedback calls POST to /feedback with { scheduleId, rating, notes }', async () => {
    const adapted: Schedule = { goalId: 'goal-1', tasks: [] }
    mockApi.post.mockResolvedValueOnce({ data: { adapted, changesExplained: 'Moved 2 tasks' } })
    const payload = { scheduleId: 'goal-1', rating: 4, notes: 'Good progress' }
    await submitFeedback(payload)
    expect(mockApi.post).toHaveBeenCalledWith('/feedback', payload)
  })

  it('8: submitFeedback returns { adapted, changesExplained }', async () => {
    const adapted: Schedule = { goalId: 'goal-1', tasks: [] }
    const changesExplained = 'Moved 2 tasks earlier in the week'
    mockApi.post.mockResolvedValueOnce({ data: { adapted, changesExplained } })
    const result = await submitFeedback({ scheduleId: 'goal-1', rating: 4, notes: 'Good progress' })
    expect(result).toEqual({ adapted, changesExplained })
  })

  it('9: non-Axios error falls back to the default message (extractMessage fallback path)', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('Network timeout'))
    await expect(
      submitGoal({ title: 'Learn Guitar', description: 'Practice daily', targetDate: '2026-12-31', settings: DEFAULT_SETTINGS })
    ).rejects.toThrow('Failed to create goal')
  })

  // --- fetchGoals -----------------------------------------------------------

  it('10: fetchGoals calls GET to /goals and returns { goals }', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { goals: [MOCK_GOAL] } })
    const result = await fetchGoals()
    expect(mockApi.get).toHaveBeenCalledWith('/goals')
    expect(result).toEqual({ goals: [MOCK_GOAL] })
  })

  it('11: fetchGoals throws with user-friendly message on error', async () => {
    mockApi.get.mockRejectedValueOnce(makeAxiosError(500, 'Internal server error'))
    await expect(fetchGoals()).rejects.toThrow('Internal server error')
  })

  // --- submitFeedback error -------------------------------------------------

  it('12: submitFeedback throws with user-friendly message on error', async () => {
    mockApi.post.mockRejectedValueOnce(makeAxiosError(422, 'Invalid rating'))
    await expect(
      submitFeedback({ scheduleId: 'goal-1', rating: 0 as never, notes: '' })
    ).rejects.toThrow('Invalid rating')
  })

  // --- updateTaskStatus -----------------------------------------------------

  it('13: updateTaskStatus calls PATCH to /goals/{goalId}/tasks/{taskId}', async () => {
    const mockTask = { ...MOCK_GOAL, id: 'task-1', status: 'complete' }
    mockApi.patch.mockResolvedValueOnce({ data: mockTask })
    const result = await updateTaskStatus('goal-1', 'task-1', 'complete')
    expect(mockApi.patch).toHaveBeenCalledWith('/goals/goal-1/tasks/task-1', { status: 'complete' })
    expect(result).toEqual(mockTask)
  })

  it('14: updateTaskStatus throws with user-friendly message on error', async () => {
    mockApi.patch.mockRejectedValueOnce(makeAxiosError(404, 'Task not found'))
    await expect(updateTaskStatus('goal-1', 'bad-id', 'complete')).rejects.toThrow('Task not found')
  })

  // --- getGoogleAuthUrl -----------------------------------------------------

  it('15: getGoogleAuthUrl returns the backend OAuth URL', () => {
    expect(getGoogleAuthUrl()).toBe('http://localhost:3001/api/auth/google')
  })

  // --- syncTaskToCalendar ---------------------------------------------------

  it('16: syncTaskToCalendar calls POST to /calendar/sync with taskId and tokens', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { eventId: 'evt-123' } })
    const tokens = { access_token: 'acc', refresh_token: 'ref' }
    const result = await syncTaskToCalendar('task-1', tokens)
    expect(mockApi.post).toHaveBeenCalledWith('/calendar/sync', {
      taskId: 'task-1',
      access_token: 'acc',
      refresh_token: 'ref',
    })
    expect(result).toEqual({ eventId: 'evt-123' })
  })

  it('17: syncTaskToCalendar throws with user-friendly message on error', async () => {
    mockApi.post.mockRejectedValueOnce(makeAxiosError(401, 'Token expired'))
    await expect(
      syncTaskToCalendar('task-1', { access_token: 'bad', refresh_token: 'bad' })
    ).rejects.toThrow('Token expired')
  })

  it('18: Axios error with no data.error field falls back to the default message', async () => {
    // Covers the `serverMsg ?? fallback` branch in extractMessage where serverMsg is undefined
    const axiosErrorNoBody = Object.assign(new Error(), {
      isAxiosError: true,
      response: { status: 500, data: {} },
    })
    mockApi.post.mockRejectedValueOnce(axiosErrorNoBody)
    await expect(
      submitGoal({ title: 'Learn Guitar', description: 'Practice daily', targetDate: '2026-12-31', settings: DEFAULT_SETTINGS })
    ).rejects.toThrow('Failed to create goal')
  })
})
