import { render, screen } from '@testing-library/react'
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
})
