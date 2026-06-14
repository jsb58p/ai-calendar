import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { GoalInput } from '../components/GoalInput/GoalInput'
import { useAppStore } from '../store/useAppStore'
import { submitGoal } from '../api/client'
import type { GoalInput as GoalInputType, Schedule, Task } from '../types'

vi.mock('../api/client', () => ({
  submitGoal: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FAKE_TASK: Task = {
  id: 'task-1',
  goalId: 'goal-1',
  title: 'First practice session',
  description: 'Learn basic chords',
  scheduledDate: '2026-07-01',
  estimatedMinutes: 30,
  status: 'pending',
  stepInstructions: ['Watch tutorial', 'Practice C chord', 'Practice G chord'],
}

const FAKE_GOAL: GoalInputType = {
  id: 'goal-1',
  title: 'Learn guitar',
  description: 'Practice daily for 30 min',
  targetDate: '2026-09-01',
  createdAt: new Date().toISOString(),
}

const FAKE_SCHEDULE: Schedule = { goalId: 'goal-1', tasks: [FAKE_TASK] }

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  useAppStore.setState({
    isLoading: false,
    error: null,
    goals: [],
    schedules: {},
    feedback: [],
    activeGoalId: null,
    selectedDate: new Date(),
    selectedTaskId: null,
    isFeedbackModalOpen: false,
    googleTokens: null,
  })
  vi.mocked(submitGoal).mockResolvedValue({ goal: FAKE_GOAL, schedule: FAKE_SCHEDULE })
})

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId('title-input'), 'Learn guitar')
  await user.type(screen.getByTestId('description-input'), 'Practice daily for 30 min')
  await user.type(screen.getByTestId('date-input'), '2026-09-01')
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GoalInput', () => {
  it('renders the heading "What\'s your goal?"', () => {
    render(<GoalInput />)
    expect(screen.getByTestId('goal-input-heading')).toHaveTextContent("What's your goal?")
  })

  it('renders the title input', () => {
    render(<GoalInput />)
    expect(screen.getByTestId('title-input')).toBeInTheDocument()
  })

  it('renders the description textarea', () => {
    render(<GoalInput />)
    expect(screen.getByTestId('description-input')).toBeInTheDocument()
  })

  it('renders the date input', () => {
    render(<GoalInput />)
    expect(screen.getByTestId('date-input')).toBeInTheDocument()
  })

  it('submit button is disabled when all fields are empty', () => {
    render(<GoalInput />)
    expect(screen.getByTestId('submit-button')).toBeDisabled()
  })

  it('submit button is enabled when title, description, and date are all filled in', async () => {
    const user = userEvent.setup()
    render(<GoalInput />)
    await fillForm(user)
    expect(screen.getByTestId('submit-button')).not.toBeDisabled()
  })

  it('clicking submit calls submitGoal with the correct payload', async () => {
    const user = userEvent.setup()
    render(<GoalInput />)
    await fillForm(user)
    await user.click(screen.getByTestId('submit-button'))
    await waitFor(() => {
      expect(vi.mocked(submitGoal)).toHaveBeenCalledWith({
        title: 'Learn guitar',
        description: 'Practice daily for 30 min',
        targetDate: '2026-09-01',
      })
    })
  })

  it('loading spinner is visible during submission', async () => {
    vi.mocked(submitGoal).mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    render(<GoalInput />)
    await fillForm(user)
    await user.click(screen.getByTestId('submit-button'))
    expect(await screen.findByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('error banner appears when submitGoal rejects', async () => {
    vi.mocked(submitGoal).mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<GoalInput />)
    await fillForm(user)
    await user.click(screen.getByTestId('submit-button'))
    expect(await screen.findByTestId('error-banner')).toHaveTextContent('Network error')
  })

  it('clicking the X button on the error banner clears the error', async () => {
    vi.mocked(submitGoal).mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<GoalInput />)
    await fillForm(user)
    await user.click(screen.getByTestId('submit-button'))
    await screen.findByTestId('error-banner')
    await user.click(screen.getByTestId('clear-error-button'))
    expect(screen.queryByTestId('error-banner')).not.toBeInTheDocument()
  })
})
