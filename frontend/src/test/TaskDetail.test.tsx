import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Schedule, Task } from '../types'

vi.mock('../api/client', () => ({
  syncTaskToCalendar: vi.fn().mockResolvedValue({ eventId: 'evt-1' }),
  updateTaskStatus: vi.fn().mockResolvedValue({}),
  submitGoal: vi.fn(),
  fetchSchedule: vi.fn(),
}))

import { TaskDetail } from '../components/TaskCard/TaskDetail'
import { useAppStore } from '../store/useAppStore'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_TASK: Task = {
  id: 'task-1',
  goalId: 'goal-1',
  title: 'Practice C chord',
  description: 'Work through the C major chord shape',
  scheduledDate: '2025-06-02',
  estimatedMinutes: 30,
  status: 'pending',
  stepInstructions: ['Tune guitar', 'Place fingers on frets', 'Strum slowly'],
}

const MOCK_SCHEDULE: Schedule = { goalId: 'goal-1', tasks: [MOCK_TASK] }

// ---------------------------------------------------------------------------
// Store helpers
// ---------------------------------------------------------------------------

function resetStore(overrides?: Partial<Parameters<typeof useAppStore.setState>[0]>) {
  useAppStore.setState({
    goals: [],
    schedules: { 'goal-1': MOCK_SCHEDULE },
    feedback: [],
    activeGoalId: 'goal-1',
    selectedDate: new Date(),
    selectedTaskId: 'task-1',
    isLoading: false,
    error: null,
    isFeedbackModalOpen: false,
    googleTokens: null,
    ...overrides,
  })
}

beforeEach(() => {
  resetStore()
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TaskDetail', () => {
  it('renders nothing when selectedTaskId is null', () => {
    useAppStore.setState({ selectedTaskId: null })
    render(<TaskDetail />)
    expect(screen.queryByTestId('task-detail-panel')).not.toBeInTheDocument()
  })

  it('renders the panel when a task is selected', () => {
    render(<TaskDetail />)
    expect(screen.getByTestId('task-detail-panel')).toBeInTheDocument()
    expect(screen.getByTestId('detail-title')).toHaveTextContent('Practice C chord')
  })

  it('formats the scheduled date as "Monday, June 2, 2025"', () => {
    render(<TaskDetail />)
    expect(screen.getByTestId('detail-date')).toHaveTextContent('Monday, June 2, 2025')
  })

  it('shows estimated minutes', () => {
    render(<TaskDetail />)
    expect(screen.getByTestId('detail-time')).toHaveTextContent('Estimated: 30 minutes')
  })

  it('renders all step instructions as numbered items', () => {
    render(<TaskDetail />)
    expect(screen.getByTestId('step-item-0')).toHaveTextContent('Tune guitar')
    expect(screen.getByTestId('step-item-1')).toHaveTextContent('Place fingers on frets')
    expect(screen.getByTestId('step-item-2')).toHaveTextContent('Strum slowly')
  })

  it('each step instruction has a checkbox', () => {
    render(<TaskDetail />)
    ;[0, 1, 2].forEach((i) => {
      const item = screen.getByTestId(`step-item-${i}`)
      expect(within(item).getByRole('checkbox')).toBeInTheDocument()
    })
  })

  it('Mark Complete button is present and enabled when status is pending', () => {
    render(<TaskDetail />)
    const btn = screen.getByTestId('mark-complete-button')
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()
  })

  it('close button sets selectedTaskId to null', () => {
    render(<TaskDetail />)
    fireEvent.click(screen.getByTestId('close-button'))
    expect(useAppStore.getState().selectedTaskId).toBeNull()
  })

  it('Mark Complete button calls updateTaskStatus and closes panel', () => {
    render(<TaskDetail />)
    fireEvent.click(screen.getByTestId('mark-complete-button'))
    const state = useAppStore.getState()
    const task = Object.values(state.schedules).flatMap((s) => s.tasks).find((t) => t.id === 'task-1')
    expect(task?.status).toBe('complete')
    expect(state.selectedTaskId).toBeNull()
  })

  it('Mark Complete button is disabled when already complete', () => {
    useAppStore.setState({
      schedules: { 'goal-1': { goalId: 'goal-1', tasks: [{ ...MOCK_TASK, status: 'complete' }] } },
    })
    render(<TaskDetail />)
    expect(screen.getByTestId('mark-complete-button')).toBeDisabled()
  })

  it('Mark Incomplete button is disabled when pending', () => {
    render(<TaskDetail />)
    expect(screen.getByTestId('mark-incomplete-button')).toBeDisabled()
  })

  it('Skip Task button calls updateTaskStatus with skipped', () => {
    render(<TaskDetail />)
    fireEvent.click(screen.getByTestId('skip-button'))
    const task = Object.values(useAppStore.getState().schedules)
      .flatMap((s) => s.tasks)
      .find((t) => t.id === 'task-1')
    expect(task?.status).toBe('skipped')
  })

  it('Skip Task button is disabled when already skipped', () => {
    useAppStore.setState({
      schedules: { 'goal-1': { goalId: 'goal-1', tasks: [{ ...MOCK_TASK, status: 'skipped' }] } },
    })
    render(<TaskDetail />)
    expect(screen.getByTestId('skip-button')).toBeDisabled()
  })

  it('sync-calendar-button is hidden when googleTokens is null', () => {
    render(<TaskDetail />)
    expect(screen.queryByTestId('sync-calendar-button')).not.toBeInTheDocument()
  })

  it('sync-calendar-button is visible when googleTokens exist and calls syncTaskToCalendar', async () => {
    const tokens = { access_token: 'acc', refresh_token: 'ref' }
    useAppStore.setState({ googleTokens: tokens })
    const { syncTaskToCalendar } = await import('../api/client')
    render(<TaskDetail />)
    fireEvent.click(screen.getByTestId('sync-calendar-button'))
    await waitFor(() => {
      expect(syncTaskToCalendar).toHaveBeenCalledWith('task-1', tokens)
    })
  })
})
