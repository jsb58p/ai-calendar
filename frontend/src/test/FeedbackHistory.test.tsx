import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import type { FeedbackEntry } from '../types'
import { FeedbackHistory } from '../components/FeedbackModal/FeedbackHistory'
import { useAppStore } from '../store/useAppStore'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<FeedbackEntry> = {}): FeedbackEntry {
  return {
    id: 'entry-1',
    scheduleId: 'goal-1',
    rating: 3,
    notes: 'Good schedule overall.',
    createdAt: '2026-06-10T10:00:00.000Z',
    ...overrides,
  }
}

function resetStore(overrides?: Partial<Parameters<typeof useAppStore.setState>[0]>) {
  useAppStore.setState({
    goals: [],
    schedules: {},
    feedback: [],
    activeGoalId: 'goal-1',
    selectedDate: new Date(),
    selectedTaskId: null,
    isLoading: false,
    error: null,
    isFeedbackModalOpen: false,
    googleTokens: null,
    toastMessage: null,
    toastDiffs: [],
    ...overrides,
  })
}

beforeEach(() => {
  resetStore()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FeedbackHistory', () => {
  it('shows no-feedback-message when feedback array is empty', () => {
    render(<FeedbackHistory />)
    expect(screen.getByTestId('no-feedback-message')).toHaveTextContent(
      'No feedback yet. Submit your first review to adapt your schedule.'
    )
  })

  it('shows entry date formatted as "Weekday, Month Day"', () => {
    resetStore({ feedback: [makeEntry({ createdAt: '2026-06-10T10:00:00.000Z' })] })
    render(<FeedbackHistory />)
    expect(screen.getByTestId('entry-date')).toHaveTextContent('Wednesday, June 10')
  })

  it('shows filled and empty stars matching the rating', () => {
    resetStore({ feedback: [makeEntry({ rating: 4 })] })
    render(<FeedbackHistory />)
    expect(screen.getByTestId('entry-rating')).toHaveTextContent('★★★★☆')
  })

  it('truncates notes longer than 100 chars in the preview', () => {
    const longNotes = 'A'.repeat(80) + 'B'.repeat(40) // 120 chars
    resetStore({ feedback: [makeEntry({ notes: longNotes })] })
    render(<FeedbackHistory />)
    const preview = screen.getByTestId('entry-notes-preview')
    expect(preview.textContent).toHaveLength(103) // 100 chars + '...'
    expect(preview).toHaveTextContent('...')
  })

  it('clicking expand-button reveals full notes', () => {
    const longNotes = 'X'.repeat(120)
    resetStore({ feedback: [makeEntry({ notes: longNotes })] })
    render(<FeedbackHistory />)
    expect(screen.queryByTestId('entry-notes-full')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('expand-button'))
    expect(screen.getByTestId('entry-notes-full')).toHaveTextContent(longNotes)
  })

  it('shows multiple entries sorted newest first', () => {
    resetStore({
      feedback: [
        makeEntry({ id: 'e1', createdAt: '2026-06-01T00:00:00.000Z', notes: 'First entry' }),
        makeEntry({ id: 'e2', createdAt: '2026-06-15T00:00:00.000Z', notes: 'Second entry' }),
      ],
    })
    render(<FeedbackHistory />)
    const entries = screen.getAllByTestId(/^feedback-entry-/)
    // Newest (June 15) first
    expect(entries[0]).toHaveTextContent('Second entry')
    expect(entries[1]).toHaveTextContent('First entry')
  })

  it('clicking collapse-button hides full notes', () => {
    const longNotes = 'Y'.repeat(120)
    resetStore({ feedback: [makeEntry({ notes: longNotes })] })
    render(<FeedbackHistory />)
    fireEvent.click(screen.getByTestId('expand-button'))
    expect(screen.getByTestId('entry-notes-full')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('collapse-button'))
    expect(screen.queryByTestId('entry-notes-full')).not.toBeInTheDocument()
  })

  it('entry count matches feedback filtered by active schedule', () => {
    resetStore({
      activeGoalId: 'goal-1',
      feedback: [
        makeEntry({ id: 'e1', scheduleId: 'goal-1' }),
        makeEntry({ id: 'e2', scheduleId: 'goal-1' }),
        makeEntry({ id: 'e3', scheduleId: 'goal-other' }), // filtered out
      ],
    })
    render(<FeedbackHistory />)
    expect(screen.getAllByTestId(/^feedback-entry-/)).toHaveLength(2)
  })
})
