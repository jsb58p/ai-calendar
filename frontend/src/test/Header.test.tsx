import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { GoalInput } from '../types'

vi.mock('../api/client', () => ({
  getGoogleAuthUrl: vi.fn(() => 'http://localhost:3001/api/auth/google'),
}))

import { Header } from '../components/Header'
import { useAppStore } from '../store/useAppStore'

const MOCK_GOAL: GoalInput = {
  id: 'goal-1',
  title: 'Learn Guitar',
  description: 'Practice daily',
  targetDate: '2026-12-31',
  createdAt: '2026-01-01T00:00:00.000Z',
}

function resetStore(overrides?: Partial<Parameters<typeof useAppStore.setState>[0]>) {
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
    isSettingsPanelOpen: false,
    ...overrides,
  })
}

beforeEach(() => {
  resetStore()
  vi.clearAllMocks()
})

describe('Header', () => {
  it('renders "SchedulerAI"', () => {
    render(<Header />)
    expect(screen.getByTestId('app-name')).toHaveTextContent('SchedulerAI')
  })

  it('shows goal title when activeGoal is in the store', () => {
    resetStore({ goals: [MOCK_GOAL], activeGoalId: 'goal-1' })
    render(<Header />)
    expect(screen.getByTestId('goal-title')).toHaveTextContent('Learn Guitar')
  })

  it('Give Feedback button is visible when activeGoal exists', () => {
    resetStore({ goals: [MOCK_GOAL], activeGoalId: 'goal-1' })
    render(<Header />)
    expect(screen.getByTestId('give-feedback-button')).toBeInTheDocument()
  })

  it('Give Feedback button is not rendered when no activeGoal', () => {
    render(<Header />)
    expect(screen.queryByTestId('give-feedback-button')).not.toBeInTheDocument()
  })

  it('Change Goal button is visible when activeGoal exists', () => {
    resetStore({ goals: [MOCK_GOAL], activeGoalId: 'goal-1' })
    render(<Header />)
    expect(screen.getByTestId('change-goal-button')).toBeInTheDocument()
  })

  it('clicking Change Goal calls clearActiveGoal', () => {
    resetStore({ goals: [MOCK_GOAL], activeGoalId: 'goal-1' })
    render(<Header />)
    fireEvent.click(screen.getByTestId('change-goal-button'))
    expect(useAppStore.getState().activeGoalId).toBeNull()
  })

  it('Connect Google Calendar button visible when no googleTokens and activeGoal exists', () => {
    resetStore({ goals: [MOCK_GOAL], activeGoalId: 'goal-1', googleTokens: null })
    render(<Header />)
    expect(screen.getByTestId('google-connect-button')).toBeInTheDocument()
  })

  it('google-connected-indicator is visible when googleTokens is set', () => {
    resetStore({
      goals: [MOCK_GOAL],
      activeGoalId: 'goal-1',
      googleTokens: { access_token: 'acc', refresh_token: 'ref' },
    })
    render(<Header />)
    expect(screen.getByTestId('google-connected-indicator')).toBeInTheDocument()
    expect(screen.queryByTestId('google-connect-button')).not.toBeInTheDocument()
  })

  it('clicking History button calls setHistoryPanelOpen(true)', () => {
    resetStore({ goals: [MOCK_GOAL], activeGoalId: 'goal-1', isHistoryPanelOpen: false })
    render(<Header />)
    fireEvent.click(screen.getByTestId('history-button'))
    expect(useAppStore.getState().isHistoryPanelOpen).toBe(true)
  })

  it('clicking settings-button calls setSettingsPanelOpen(true)', () => {
    render(<Header />)
    fireEvent.click(screen.getByTestId('settings-button'))
    expect(useAppStore.getState().isSettingsPanelOpen).toBe(true)
  })

  it('Connect Google Calendar button sets window.location.href to the auth URL', () => {
    const origDescriptor = Object.getOwnPropertyDescriptor(window, 'location')
    Object.defineProperty(window, 'location', { writable: true, configurable: true, value: { href: '' } })
    resetStore({ goals: [MOCK_GOAL], activeGoalId: 'goal-1', googleTokens: null })
    render(<Header />)
    fireEvent.click(screen.getByTestId('google-connect-button'))
    expect(window.location.href).toBe('http://localhost:3001/api/auth/google')
    if (origDescriptor) Object.defineProperty(window, 'location', origDescriptor)
  })
})
