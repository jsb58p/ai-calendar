import { render, screen, fireEvent, within } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Schedule, Task } from '../types'

const mockSetSelectedDate = vi.hoisted(() => vi.fn())
const mockSetSelectedTaskId = vi.hoisted(() => vi.fn())

vi.mock('../store/useAppStore', () => ({
  useAppStore: (selector: (state: any) => any) =>
    selector({
      selectedDate: new Date(2025, 5, 15),
      setSelectedDate: mockSetSelectedDate,
      setSelectedTaskId: mockSetSelectedTaskId,
    }),
}))

import { CalendarGrid } from '../components/Calendar/CalendarGrid'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeTask(id: string, scheduledDate: string): Task {
  return {
    id,
    goalId: 'goal-1',
    title: `Task ${id}`,
    description: 'desc',
    scheduledDate,
    estimatedMinutes: 30,
    status: 'pending',
    stepInstructions: ['step 1'],
  }
}

const mockSchedule: Schedule = {
  goalId: 'goal-1',
  tasks: [
    makeTask('t1', '2025-06-10'),
    makeTask('t2', '2025-06-20'),
    makeTask('t3', '2025-06-20'),
    makeTask('t4', '2025-06-20'),
    makeTask('t5', '2025-06-20'), // 4 on June 20 → 3 chips + "+1 more"
  ],
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2025, 5, 15)) // June 15, 2025
  mockSetSelectedDate.mockClear()
  mockSetSelectedTaskId.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CalendarGrid', () => {
  it('renders 7 day-of-week header cells (Sun through Sat)', () => {
    render(<CalendarGrid schedule={mockSchedule} />)
    const headers = screen.getAllByTestId('day-header')
    expect(headers).toHaveLength(7)
    expect(headers[0]).toHaveTextContent('Sun')
    expect(headers[6]).toHaveTextContent('Sat')
  })

  it('renders 30 day cells for June 2025', () => {
    render(<CalendarGrid schedule={mockSchedule} />)
    expect(screen.getAllByTestId(/^day-cell-2025-06-/)).toHaveLength(30)
  })

  it("today's cell has data-today attribute", () => {
    render(<CalendarGrid schedule={mockSchedule} />)
    expect(screen.getByTestId('day-cell-2025-06-15')).toHaveAttribute('data-today', 'true')
  })

  it('a task on a specific date appears as a card in the correct day cell', () => {
    render(<CalendarGrid schedule={mockSchedule} />)
    const cell = screen.getByTestId('day-cell-2025-06-10')
    expect(within(cell).getByTestId('task-card')).toBeInTheDocument()
    expect(within(cell).getByTestId('task-title')).toHaveTextContent('Task t1')
  })

  it('more than 3 tasks on one day shows "+N more" indicator', () => {
    render(<CalendarGrid schedule={mockSchedule} />)
    const cell = screen.getByTestId('day-cell-2025-06-20')
    expect(within(cell).getAllByTestId('task-card')).toHaveLength(3)
    expect(within(cell).getByTestId('more-tasks-indicator')).toHaveTextContent('+1 more')
  })

  it('clicking prev-month-button shows the previous month', () => {
    render(<CalendarGrid schedule={mockSchedule} />)
    fireEvent.click(screen.getByTestId('prev-month-button'))
    expect(screen.getByTestId('month-display')).toHaveTextContent('May 2025')
  })

  it('clicking next-month-button shows the next month', () => {
    render(<CalendarGrid schedule={mockSchedule} />)
    fireEvent.click(screen.getByTestId('next-month-button'))
    expect(screen.getByTestId('month-display')).toHaveTextContent('July 2025')
  })

  it('clicking the Today button resets to the current month and year', () => {
    render(<CalendarGrid schedule={mockSchedule} />)
    fireEvent.click(screen.getByTestId('next-month-button'))
    fireEvent.click(screen.getByTestId('next-month-button'))
    expect(screen.getByTestId('month-display')).toHaveTextContent('August 2025')
    fireEvent.click(screen.getByTestId('today-button'))
    expect(screen.getByTestId('month-display')).toHaveTextContent('June 2025')
  })

  it('clicking a day cell calls setSelectedDate with the correct Date object', () => {
    render(<CalendarGrid schedule={mockSchedule} />)
    fireEvent.click(screen.getByTestId('day-cell-2025-06-05'))
    expect(mockSetSelectedDate).toHaveBeenCalledWith(new Date(2025, 5, 5))
  })

  it('clicking prev month in January rolls back to December of the previous year', () => {
    vi.setSystemTime(new Date(2025, 0, 15)) // January 2025
    render(<CalendarGrid schedule={mockSchedule} />)
    expect(screen.getByTestId('month-display')).toHaveTextContent('January 2025')
    fireEvent.click(screen.getByTestId('prev-month-button'))
    expect(screen.getByTestId('month-display')).toHaveTextContent('December 2024')
  })

  it('clicking next month in December rolls forward to January of the next year', () => {
    vi.setSystemTime(new Date(2025, 11, 15)) // December 2025
    render(<CalendarGrid schedule={mockSchedule} />)
    expect(screen.getByTestId('month-display')).toHaveTextContent('December 2025')
    fireEvent.click(screen.getByTestId('next-month-button'))
    expect(screen.getByTestId('month-display')).toHaveTextContent('January 2026')
  })
})
