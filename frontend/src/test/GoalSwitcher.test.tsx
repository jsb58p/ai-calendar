import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { GoalSwitcher } from '../components/GoalSwitcher/GoalSwitcher'
import { useAppStore } from '../store/useAppStore'
import type { GoalInput, Schedule } from '../types'

// ---------------------------------------------------------------------------
// Mock the API client
// ---------------------------------------------------------------------------
vi.mock('../api/client', () => ({
  fetchSchedule: vi.fn().mockResolvedValue({ goalId: 'g1', tasks: [] }),
  deleteGoal: vi.fn().mockResolvedValue(undefined),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const GOAL_OLD: GoalInput = {
  id: 'g1', userId: 'u1', title: 'Learn Guitar', description: '',
  targetDate: '2026-06-30', createdAt: '2025-01-01T00:00:00.000Z',
}
const GOAL_NEW: GoalInput = {
  id: 'g2', userId: 'u1', title: 'Run a 5K', description: '',
  targetDate: '2026-09-01', createdAt: '2025-06-01T00:00:00.000Z',
}
const SCHEDULE_WITH_TASKS: Schedule = {
  goalId: 'g1',
  tasks: [
    { id: 't1', goalId: 'g1', title: 'Practice', description: '', scheduledDate: '2026-01-01', estimatedMinutes: 30, status: 'complete', stepInstructions: [] },
    { id: 't2', goalId: 'g1', title: 'Rest', description: '', scheduledDate: '2026-01-02', estimatedMinutes: 30, status: 'pending', stepInstructions: [] },
  ],
}

const onClose = vi.fn()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function resetStore() {
  useAppStore.setState({ goals: [], schedules: {}, activeGoalId: null })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  resetStore()
  localStorage.clear()
  vi.clearAllMocks()
  onClose.mockReset()
})

describe('GoalSwitcher', () => {
  it('shows empty state when there are no goals', () => {
    render(<GoalSwitcher isOpen={true} onClose={onClose} />)
    expect(screen.getByTestId('goal-switcher-empty')).toBeInTheDocument()
  })

  it('renders goals sorted newest first', () => {
    useAppStore.setState({ goals: [GOAL_OLD, GOAL_NEW] })
    render(<GoalSwitcher isOpen={true} onClose={onClose} />)
    const items = screen.getAllByTestId('goal-switcher-item')
    expect(items[0]).toHaveTextContent('Run a 5K')
    expect(items[1]).toHaveTextContent('Learn Guitar')
  })

  it('shows completion badge when schedule has tasks', () => {
    useAppStore.setState({ goals: [GOAL_OLD], schedules: { g1: SCHEDULE_WITH_TASKS } })
    render(<GoalSwitcher isOpen={true} onClose={onClose} />)
    expect(screen.getByText('1/2 tasks')).toBeInTheDocument()
  })

  it('shows "Active" label instead of Open button for the active goal', () => {
    useAppStore.setState({ goals: [GOAL_OLD], activeGoalId: 'g1' })
    render(<GoalSwitcher isOpen={true} onClose={onClose} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.queryByTestId('goal-open-button')).not.toBeInTheDocument()
  })

  it('"New Goal" button clears active goal and calls onClose', () => {
    useAppStore.setState({ activeGoalId: 'g1', goals: [GOAL_OLD] })
    render(<GoalSwitcher isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('new-goal-button'))
    expect(useAppStore.getState().activeGoalId).toBeNull()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('"New Goal" button removes activeGoalId from localStorage', () => {
    localStorage.setItem('activeGoalId', 'g1')
    useAppStore.setState({ goals: [GOAL_OLD] })
    render(<GoalSwitcher isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('new-goal-button'))
    expect(localStorage.getItem('activeGoalId')).toBeNull()
  })

  it('"Open" button sets activeGoalId and closes modal when schedule already loaded', async () => {
    useAppStore.setState({ goals: [GOAL_OLD], schedules: { g1: { goalId: 'g1', tasks: [] } } })
    render(<GoalSwitcher isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('goal-open-button'))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(useAppStore.getState().activeGoalId).toBe('g1')
    expect(localStorage.getItem('activeGoalId')).toBe('g1')
  })

  it('"Open" button fetches schedule when not already in store', async () => {
    const { fetchSchedule } = await import('../api/client')
    useAppStore.setState({ goals: [GOAL_OLD], schedules: {} })
    render(<GoalSwitcher isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('goal-open-button'))
    await waitFor(() => expect(fetchSchedule).toHaveBeenCalledWith('g1'))
  })

  it('"Delete" button calls deleteGoal and removes the goal from store', async () => {
    const { deleteGoal } = await import('../api/client')
    useAppStore.setState({ goals: [GOAL_OLD] })
    render(<GoalSwitcher isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('goal-delete-button'))
    await waitFor(() => expect(deleteGoal).toHaveBeenCalledWith('g1'))
    expect(useAppStore.getState().goals).toHaveLength(0)
  })

  it('deleting the active goal clears activeGoalId and removes it from localStorage', async () => {
    localStorage.setItem('activeGoalId', 'g1')
    useAppStore.setState({ goals: [GOAL_OLD], activeGoalId: 'g1' })
    render(<GoalSwitcher isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('goal-delete-button'))
    await waitFor(() => expect(useAppStore.getState().goals).toHaveLength(0))
    expect(useAppStore.getState().activeGoalId).toBeNull()
    expect(localStorage.getItem('activeGoalId')).toBeNull()
  })

  it('does not render when isOpen is false', () => {
    useAppStore.setState({ goals: [GOAL_OLD] })
    render(<GoalSwitcher isOpen={false} onClose={onClose} />)
    expect(screen.queryByTestId('goal-switcher-panel')).not.toBeInTheDocument()
  })
})
