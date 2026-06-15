import { describe, it, expect, beforeEach } from 'vitest'
import type { GoalInput, Schedule, Task, FeedbackEntry } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import { useAppStore } from '../store/useAppStore'

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

const MOCK_TASK: Task = {
  id: 'task-1',
  goalId: 'goal-1',
  title: 'Practice C chord',
  description: 'Work on C major shape',
  scheduledDate: '2026-06-01',
  estimatedMinutes: 30,
  status: 'pending',
  stepInstructions: ['Tune guitar', 'Place fingers'],
}

const MOCK_SCHEDULE: Schedule = {
  goalId: 'goal-1',
  tasks: [MOCK_TASK],
}

const MOCK_FEEDBACK: FeedbackEntry = {
  id: 'fb-1',
  scheduleId: 'goal-1',
  rating: 4,
  notes: 'Good progress this week',
  createdAt: '2026-06-10T12:00:00.000Z',
}

// ---------------------------------------------------------------------------
// Reset to initial state before every test
// ---------------------------------------------------------------------------

beforeEach(() => {
  useAppStore.setState(useAppStore.getInitialState())
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAppStore', () => {
  it('1: initial goals array is empty', () => {
    expect(useAppStore.getState().goals).toEqual([])
  })

  it('2: addGoal adds to goals array', () => {
    useAppStore.getState().addGoal(MOCK_GOAL)
    const { goals } = useAppStore.getState()
    expect(goals).toHaveLength(1)
    expect(goals[0]).toEqual(MOCK_GOAL)
  })

  it('3: setSchedule stores schedule under the correct goalId key', () => {
    useAppStore.getState().setSchedule(MOCK_SCHEDULE)
    expect(useAppStore.getState().schedules['goal-1']).toEqual(MOCK_SCHEDULE)
  })

  it('4: updateTaskStatus changes the task status in the nested schedule', () => {
    useAppStore.getState().setSchedule(MOCK_SCHEDULE)
    useAppStore.getState().updateTaskStatus('task-1', 'complete')
    const task = useAppStore.getState().schedules['goal-1']!.tasks[0]!
    expect(task.status).toBe('complete')
  })

  it('5: updateTaskStatus with an unknown taskId does not throw', () => {
    useAppStore.getState().setSchedule(MOCK_SCHEDULE)
    expect(() =>
      useAppStore.getState().updateTaskStatus('non-existent-id', 'complete')
    ).not.toThrow()
  })

  it('6: updateTaskStatus does not affect other tasks in the same schedule', () => {
    const task2: Task = { ...MOCK_TASK, id: 'task-2', title: 'Task 2', status: 'pending' }
    useAppStore.getState().setSchedule({ goalId: 'goal-1', tasks: [MOCK_TASK, task2] })
    useAppStore.getState().updateTaskStatus('task-1', 'complete')
    const tasks = useAppStore.getState().schedules['goal-1']!.tasks
    expect(tasks.find((t) => t.id === 'task-1')!.status).toBe('complete')
    expect(tasks.find((t) => t.id === 'task-2')!.status).toBe('pending')
  })

  it('7: setLoading(true) then setLoading(false) works correctly', () => {
    useAppStore.getState().setLoading(true)
    expect(useAppStore.getState().isLoading).toBe(true)
    useAppStore.getState().setLoading(false)
    expect(useAppStore.getState().isLoading).toBe(false)
  })

  it('8: setError sets the error message', () => {
    useAppStore.getState().setError('Something went wrong')
    expect(useAppStore.getState().error).toBe('Something went wrong')
  })

  it('9: clearError sets error to null', () => {
    useAppStore.getState().setError('Something went wrong')
    useAppStore.getState().clearError()
    expect(useAppStore.getState().error).toBeNull()
  })

  it('10: addFeedback adds to the feedback array', () => {
    useAppStore.getState().addFeedback(MOCK_FEEDBACK)
    const { feedback } = useAppStore.getState()
    expect(feedback).toHaveLength(1)
    expect(feedback[0]).toEqual(MOCK_FEEDBACK)
  })

  it('11: clearActiveGoal sets activeGoalId to null but does NOT clear schedules', () => {
    useAppStore.getState().setSchedule(MOCK_SCHEDULE)
    useAppStore.getState().setActiveGoalId('goal-1')
    expect(useAppStore.getState().activeGoalId).toBe('goal-1')
    useAppStore.getState().clearActiveGoal()
    expect(useAppStore.getState().activeGoalId).toBeNull()
    expect(useAppStore.getState().schedules['goal-1']).toEqual(MOCK_SCHEDULE)
  })

  it('12: setGoogleTokens stores tokens, calling it with null clears them', () => {
    const tokens = { access_token: 'acc-token', refresh_token: 'ref-token' }
    useAppStore.getState().setGoogleTokens(tokens)
    expect(useAppStore.getState().googleTokens).toEqual(tokens)
    useAppStore.getState().setGoogleTokens(null)
    expect(useAppStore.getState().googleTokens).toBeNull()
  })

  it('13: updateSettings merges a partial patch while preserving other fields', () => {
    const initial = useAppStore.getState().settings
    useAppStore.getState().updateSettings({ availableDays: [1, 3, 5] })
    const { settings } = useAppStore.getState()
    expect(settings.availableDays).toEqual([1, 3, 5])
    expect(settings.dailyStartTime).toBe(initial.dailyStartTime)
    expect(settings.dailyEndTime).toBe(initial.dailyEndTime)
    expect(settings.minTaskDuration).toBe(initial.minTaskDuration)
  })

  it('14: resetSettings returns all fields to DEFAULT_SETTINGS values', () => {
    useAppStore.getState().updateSettings({ availableDays: [1, 3, 5], dailyStartTime: '10:00' })
    useAppStore.getState().resetSettings()
    const { settings } = useAppStore.getState()
    expect(settings.availableDays).toEqual(DEFAULT_SETTINGS.availableDays)
    expect(settings.dailyStartTime).toBe(DEFAULT_SETTINGS.dailyStartTime)
    expect(settings.difficultyRamp).toBe(DEFAULT_SETTINGS.difficultyRamp)
  })

  it('15: after updateSettings, localStorage contains the updated value', () => {
    useAppStore.getState().updateSettings({ availableDays: [1, 3, 5] })
    const stored = JSON.parse(localStorage.getItem('userSettings')!)
    expect(stored.availableDays).toEqual([1, 3, 5])
  })
})
