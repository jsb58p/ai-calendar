import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { FeedbackEntry, GoalInput } from '../types'

import { HistoryPanel } from '../components/FeedbackModal/HistoryPanel'
import { useAppStore } from '../store/useAppStore'

const MOCK_GOAL: GoalInput = {
  id: 'goal-1',
  title: 'Learn Guitar',
  description: 'Practice daily',
  targetDate: '2026-12-31',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const MOCK_ENTRY: FeedbackEntry = {
  id: 'entry-1',
  scheduleId: 'goal-1',
  rating: 4,
  notes: 'Good progress this week',
  createdAt: '2026-06-10T12:00:00.000Z',
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
    toastMessage: null,
    toastDiffs: [],
    isHistoryPanelOpen: false,
    ...overrides,
  })
}

beforeEach(() => {
  resetStore()
  vi.clearAllMocks()
})

describe('HistoryPanel', () => {
  it('renders nothing when isHistoryPanelOpen is false', () => {
    resetStore({ isHistoryPanelOpen: false })
    render(<HistoryPanel />)
    expect(screen.queryByTestId('history-panel')).not.toBeInTheDocument()
  })

  it('renders the panel when isHistoryPanelOpen is true', () => {
    resetStore({ isHistoryPanelOpen: true })
    render(<HistoryPanel />)
    expect(screen.getByTestId('history-panel')).toBeInTheDocument()
  })

  it('shows no-feedback message when feedback array is empty', () => {
    resetStore({ isHistoryPanelOpen: true, activeGoalId: 'goal-1', feedback: [] })
    render(<HistoryPanel />)
    expect(screen.getByTestId('no-feedback-message')).toBeInTheDocument()
  })

  it('shows feedback entries when feedback exists for the active goal', () => {
    resetStore({
      isHistoryPanelOpen: true,
      activeGoalId: 'goal-1',
      goals: [MOCK_GOAL],
      feedback: [MOCK_ENTRY],
    })
    render(<HistoryPanel />)
    expect(screen.getByTestId('feedback-entry-0')).toBeInTheDocument()
  })

  it('close button calls setHistoryPanelOpen(false)', () => {
    resetStore({ isHistoryPanelOpen: true })
    render(<HistoryPanel />)
    fireEvent.click(screen.getByTestId('history-panel-close'))
    expect(useAppStore.getState().isHistoryPanelOpen).toBe(false)
  })
})
