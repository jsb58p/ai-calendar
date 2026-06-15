import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Schedule, Task } from '../types'

// ---------------------------------------------------------------------------
// Mock the API client so the useEffect in App does not fire real requests
// ---------------------------------------------------------------------------
vi.mock('../api/client', () => ({
  fetchSchedule: vi.fn().mockResolvedValue({ goalId: 'goal-1', tasks: [] }),
  submitGoal: vi.fn(),
  fetchGoals: vi.fn().mockResolvedValue({ goals: [] }),
  getGoogleAuthUrl: vi.fn(() => 'http://localhost:3001/api/auth/google'),
  getMe: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'test@example.com', displayName: 'Test User', emailVerified: true } }),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
  getGoogleSignInUrl: vi.fn(() => '/api/auth/users/google'),
  syncAllTasks: vi.fn().mockResolvedValue(undefined),
  deleteGoal: vi.fn().mockResolvedValue(undefined),
}))

import App from '../App'
import { useAppStore } from '../store/useAppStore'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_TASK: Task = {
  id: 'task-1',
  goalId: 'goal-1',
  title: 'Practice chords',
  description: 'Daily guitar practice',
  scheduledDate: '2025-06-15',
  estimatedMinutes: 30,
  status: 'pending',
  stepInstructions: ['Tune guitar', 'Practice C chord'],
}

const MOCK_SCHEDULE: Schedule = {
  goalId: 'goal-1',
  tasks: [MOCK_TASK],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AUTH_USER = { id: 'user-1', email: 'test@example.com', displayName: 'Test User', emailVerified: true }

function resetStore() {
  useAppStore.setState({
    authLoading: false,
    isAuthenticated: true,
    currentUser: AUTH_USER,
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
  })
}

function populateStore(goalId: string, schedule: Schedule) {
  useAppStore.setState({
    activeGoalId: goalId,
    schedules: { [goalId]: schedule },
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  resetStore()
  localStorage.clear()
  vi.clearAllMocks()
})

describe('App integration', () => {
  it('renders GoalInput when store has no activeGoalId', () => {
    render(<App />)
    expect(screen.getByTestId('goal-input-heading')).toHaveTextContent("What's your goal?")
  })

  it('renders CalendarGrid when store has an activeGoalId and matching schedule', () => {
    populateStore('goal-1', MOCK_SCHEDULE)
    render(<App />)
    expect(screen.getAllByTestId('day-header').length).toBe(7)
  })

  it('reads OAuth tokens from URL params, saves to store and clears the URL', async () => {
    window.history.pushState({}, '', '?access_token=test-acc&refresh_token=test-ref')
    render(<App />)
    await waitFor(() =>
      expect(useAppStore.getState().googleTokens).toEqual({
        access_token: 'test-acc',
        refresh_token: 'test-ref',
      })
    )
    expect(window.location.search).toBe('')
  })

  it('clears activeGoalId from localStorage when fetchSchedule rejects', async () => {
    const { fetchSchedule } = await import('../api/client')
    vi.mocked(fetchSchedule).mockRejectedValueOnce(new Error('Not found'))
    localStorage.setItem('activeGoalId', 'goal-1')
    render(<App />)
    await waitFor(() => expect(localStorage.getItem('activeGoalId')).toBeNull())
  })

  it('restores googleTokens from localStorage when no URL params are present', async () => {
    const tokens = { access_token: 'stored-acc', refresh_token: 'stored-ref' }
    localStorage.setItem('googleTokens', JSON.stringify(tokens))
    render(<App />)
    await waitFor(() =>
      expect(useAppStore.getState().googleTokens).toEqual(tokens)
    )
  })

  it('removes invalid googleTokens JSON from localStorage without throwing', async () => {
    localStorage.setItem('googleTokens', '{not-valid-json')
    render(<App />)
    await waitFor(() => expect(localStorage.getItem('googleTokens')).toBeNull())
    expect(useAppStore.getState().googleTokens).toBeNull()
  })

  it('shows GoalInput when activeGoalId is set but its schedule has not yet loaded', () => {
    useAppStore.setState({ activeGoalId: 'goal-1', schedules: {} })
    render(<App />)
    expect(screen.getByTestId('goal-input-heading')).toBeInTheDocument()
  })

  it('loads schedule and renders CalendarGrid when localStorage activeGoalId resolves', async () => {
    const { fetchSchedule } = await import('../api/client')
    vi.mocked(fetchSchedule).mockResolvedValueOnce(MOCK_SCHEDULE)
    localStorage.setItem('activeGoalId', 'goal-1')
    render(<App />)
    await waitFor(() => expect(screen.getAllByTestId('day-header')).toHaveLength(7))
  })

  it('pressing Escape when a task is selected clears selectedTaskId', async () => {
    populateStore('goal-1', MOCK_SCHEDULE)
    useAppStore.setState({ selectedTaskId: 'task-1' })
    render(<App />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(useAppStore.getState().selectedTaskId).toBeNull()
  })

  it('clicking toast dismiss clears toastMessage in the store', async () => {
    populateStore('goal-1', MOCK_SCHEDULE)
    useAppStore.setState({ toastMessage: 'Schedule updated!', toastDiffs: [] })
    render(<App />)
    fireEvent.click(screen.getByTestId('toast-dismiss'))
    expect(useAppStore.getState().toastMessage).toBeNull()
  })
})
