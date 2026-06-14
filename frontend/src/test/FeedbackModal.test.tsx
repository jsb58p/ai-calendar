import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Schedule } from '../types'

vi.mock('../api/client', () => ({
  submitFeedback: vi.fn(),
}))

import { FeedbackModal } from '../components/FeedbackModal/FeedbackModal'
import { Toast } from '../components/Toast'
import { useAppStore } from '../store/useAppStore'
import { submitFeedback } from '../api/client'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SCHEDULE: Schedule = {
  goalId: 'goal-1',
  tasks: [
    {
      id: 'task-1',
      goalId: 'goal-1',
      title: 'Practice C chord',
      description: 'Work on it',
      scheduledDate: '2026-07-01',
      estimatedMinutes: 30,
      status: 'pending',
      stepInstructions: ['Tune guitar'],
    },
  ],
}

const ADAPTED_SCHEDULE: Schedule = {
  goalId: 'goal-1',
  tasks: [{ ...MOCK_SCHEDULE.tasks[0]!, scheduledDate: '2026-07-02' }],
}

const CHANGES_EXPLAINED = 'Moved tasks to better times based on your feedback.'

// ---------------------------------------------------------------------------
// Wrapper — renders FeedbackModal + Toast driven by the store
// ---------------------------------------------------------------------------

function ModalWithToast() {
  const toastMessage = useAppStore((s) => s.toastMessage)
  const setToastMessage = useAppStore((s) => s.setToastMessage)
  return (
    <>
      <FeedbackModal />
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </>
  )
}

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
    selectedTaskId: null,
    isLoading: false,
    error: null,
    isFeedbackModalOpen: true,
    googleTokens: null,
    toastMessage: null,
    ...overrides,
  })
}

beforeEach(() => {
  resetStore()
  vi.clearAllMocks()
  vi.mocked(submitFeedback).mockResolvedValue({
    adapted: ADAPTED_SCHEDULE,
    changesExplained: CHANGES_EXPLAINED,
  })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FeedbackModal', () => {
  it('renders when isFeedbackModalOpen is true', () => {
    render(<ModalWithToast />)
    expect(screen.getByTestId('modal-panel')).toBeInTheDocument()
    expect(screen.getByTestId('modal-title')).toHaveTextContent("How's your schedule working?")
  })

  it('returns null when isFeedbackModalOpen is false', () => {
    resetStore({ isFeedbackModalOpen: false })
    render(<ModalWithToast />)
    expect(screen.queryByTestId('modal-panel')).not.toBeInTheDocument()
  })

  it('clicking the backdrop calls setFeedbackModalOpen(false)', () => {
    render(<ModalWithToast />)
    fireEvent.click(screen.getByTestId('modal-backdrop'))
    expect(useAppStore.getState().isFeedbackModalOpen).toBe(false)
  })

  it('pressing Escape on the modal panel calls setFeedbackModalOpen(false)', () => {
    render(<ModalWithToast />)
    fireEvent.keyDown(screen.getByTestId('modal-panel'), { key: 'Escape' })
    expect(useAppStore.getState().isFeedbackModalOpen).toBe(false)
  })

  it('clicking the X button calls setFeedbackModalOpen(false)', () => {
    render(<ModalWithToast />)
    fireEvent.click(screen.getByTestId('modal-close-button'))
    expect(useAppStore.getState().isFeedbackModalOpen).toBe(false)
  })

  it('Submit button is disabled when no star is selected', () => {
    render(<ModalWithToast />)
    expect(screen.getByTestId('submit-feedback-button')).toBeDisabled()
  })

  it('Submit button is enabled after clicking a star', () => {
    render(<ModalWithToast />)
    fireEvent.click(screen.getByTestId('star-3'))
    expect(screen.getByTestId('submit-feedback-button')).not.toBeDisabled()
  })

  it('clicking star 4 sets rating to 4 — stars 1-4 are filled, star 5 is not', () => {
    render(<ModalWithToast />)
    fireEvent.click(screen.getByTestId('star-4'))
    expect(screen.getByTestId('star-1')).toHaveClass('star-filled')
    expect(screen.getByTestId('star-2')).toHaveClass('star-filled')
    expect(screen.getByTestId('star-3')).toHaveClass('star-filled')
    expect(screen.getByTestId('star-4')).toHaveClass('star-filled')
    expect(screen.getByTestId('star-5')).toHaveClass('star-empty')
  })

  it('clicking Cancel calls setFeedbackModalOpen(false)', () => {
    render(<ModalWithToast />)
    fireEvent.click(screen.getByTestId('cancel-button'))
    expect(useAppStore.getState().isFeedbackModalOpen).toBe(false)
  })

  it('clicking Submit calls submitFeedback with scheduleId, rating, and notes', async () => {
    render(<ModalWithToast />)
    fireEvent.click(screen.getByTestId('star-4'))
    fireEvent.change(screen.getByTestId('notes-input'), {
      target: { value: 'Too many tasks on Mondays' },
    })
    fireEvent.click(screen.getByTestId('submit-feedback-button'))
    await waitFor(() => {
      expect(submitFeedback).toHaveBeenCalledWith({
        scheduleId: 'goal-1',
        rating: 4,
        notes: 'Too many tasks on Mondays',
      })
    })
  })

  it('on success, toast appears with changesExplained text', async () => {
    render(<ModalWithToast />)
    fireEvent.click(screen.getByTestId('star-5'))
    fireEvent.click(screen.getByTestId('submit-feedback-button'))
    await waitFor(() => {
      expect(screen.getByTestId('toast')).toHaveTextContent(CHANGES_EXPLAINED)
    })
  })

  it('on API error, modal-error div shows the error message', async () => {
    vi.mocked(submitFeedback).mockRejectedValueOnce(new Error('Server unavailable'))
    render(<ModalWithToast />)
    fireEvent.click(screen.getByTestId('star-2'))
    fireEvent.click(screen.getByTestId('submit-feedback-button'))
    await waitFor(() => {
      expect(screen.getByTestId('modal-error')).toHaveTextContent('Server unavailable')
    })
  })
})
