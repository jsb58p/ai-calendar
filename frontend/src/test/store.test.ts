import { describe, it, expect, beforeEach } from 'vitest'
import type { Task } from '../types'
import { useAppStore } from '../store/useAppStore'

function resetStore() {
  useAppStore.setState({
    goals: [],
    schedules: {},
    feedback: [],
    activeGoalId: null,
    selectedDate: new Date(),
    selectedTaskId: null,
    isLoading: false,
    error: null,
    isFeedbackModalOpen: false,
    googleTokens: null,
    toastMessage: null,
    toastDiffs: [],
    isHistoryPanelOpen: false,
  })
}

function makeTask(id: string, goalId = 'goal-1'): Task {
  return {
    id,
    goalId,
    title: `Task ${id}`,
    description: 'desc',
    scheduledDate: '2026-06-01',
    estimatedMinutes: 30,
    status: 'pending',
    stepInstructions: ['step 1'],
  }
}

beforeEach(() => {
  resetStore()
})

describe('useAppStore', () => {
  it('clearError sets error to null', () => {
    useAppStore.setState({ error: 'Something broke' })
    useAppStore.getState().clearError()
    expect(useAppStore.getState().error).toBeNull()
  })

  it('setGoogleTokens(null) clears tokens', () => {
    useAppStore.setState({ googleTokens: { access_token: 'abc', refresh_token: 'xyz' } })
    useAppStore.getState().setGoogleTokens(null)
    expect(useAppStore.getState().googleTokens).toBeNull()
  })

  it('setHistoryPanelOpen toggles correctly', () => {
    useAppStore.getState().setHistoryPanelOpen(true)
    expect(useAppStore.getState().isHistoryPanelOpen).toBe(true)
    useAppStore.getState().setHistoryPanelOpen(false)
    expect(useAppStore.getState().isHistoryPanelOpen).toBe(false)
  })

  it('updateTaskStatus with an unknown taskId leaves state unchanged', () => {
    const task = makeTask('task-1')
    useAppStore.setState({ schedules: { 'goal-1': { goalId: 'goal-1', tasks: [task] } } })
    const stateBefore = useAppStore.getState().schedules
    useAppStore.getState().updateTaskStatus('non-existent', 'complete')
    // changed stays false → returns same `s` reference
    expect(useAppStore.getState().schedules).toBe(stateBefore)
  })

  it('updateTaskStatus only updates the matching task across multiple schedules', () => {
    const task1 = makeTask('task-1', 'goal-1')
    const task2 = makeTask('task-2', 'goal-2')
    useAppStore.setState({
      schedules: {
        'goal-1': { goalId: 'goal-1', tasks: [task1] },
        'goal-2': { goalId: 'goal-2', tasks: [task2] },
      },
    })
    useAppStore.getState().updateTaskStatus('task-2', 'complete')
    const { schedules } = useAppStore.getState()
    expect(schedules['goal-1']!.tasks[0]!.status).toBe('pending')
    expect(schedules['goal-2']!.tasks[0]!.status).toBe('complete')
  })
})
