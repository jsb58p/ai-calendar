import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScheduleChanges } from '../components/FeedbackModal/ScheduleChanges'
import type { DiffEntry } from '../utils/diff'
import type { Task } from '../types'

function makeTask(id: string): Task {
  return {
    id,
    goalId: 'goal-1',
    title: `Task ${id}`,
    description: 'desc',
    scheduledDate: '2026-07-01',
    estimatedMinutes: 30,
    status: 'pending',
    stepInstructions: [],
  }
}

describe('ScheduleChanges', () => {
  it('returns null when diffs is empty', () => {
    render(<ScheduleChanges diffs={[]} />)
    expect(screen.queryByTestId('schedule-changes')).not.toBeInTheDocument()
  })

  it('rescheduled entry shows old and new date', () => {
    const diffs: DiffEntry[] = [
      { type: 'rescheduled', task: makeTask('t1'), oldDate: '2026-07-01', newDate: '2026-07-10' },
    ]
    render(<ScheduleChanges diffs={diffs} />)
    const entry = screen.getByTestId('change-rescheduled')
    expect(entry).toHaveTextContent('2026-07-01')
    expect(entry).toHaveTextContent('2026-07-10')
    expect(entry).toHaveTextContent('Task t1')
  })

  it('added entry shows task title', () => {
    const diffs: DiffEntry[] = [
      { type: 'added', task: makeTask('t2'), newDate: '2026-07-05' },
    ]
    render(<ScheduleChanges diffs={diffs} />)
    const entry = screen.getByTestId('change-added')
    expect(entry).toHaveTextContent('Task t2')
    expect(entry).toHaveTextContent('Added')
  })

  it('removed entry shows task title with ❌', () => {
    const diffs: DiffEntry[] = [
      { type: 'removed', task: makeTask('t3') },
    ]
    render(<ScheduleChanges diffs={diffs} />)
    const entry = screen.getByTestId('change-removed')
    expect(entry).toHaveTextContent('❌')
    expect(entry).toHaveTextContent('Task t3')
  })
})
