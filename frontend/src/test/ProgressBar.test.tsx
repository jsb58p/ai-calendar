import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProgressBar } from '../components/Calendar/ProgressBar'
import type { Schedule, Task } from '../types'

function makeTask(id: string, status: Task['status']): Task {
  return {
    id,
    goalId: 'goal-1',
    title: `Task ${id}`,
    description: 'desc',
    scheduledDate: '2026-07-01',
    estimatedMinutes: 30,
    status,
    stepInstructions: ['step 1'],
  }
}

function makeSchedule(tasks: Task[]): Schedule {
  return { goalId: 'goal-1', tasks }
}

describe('ProgressBar', () => {
  it('shows 0% when no tasks are complete', () => {
    const schedule = makeSchedule([
      makeTask('t1', 'pending'),
      makeTask('t2', 'pending'),
      makeTask('t3', 'pending'),
      makeTask('t4', 'pending'),
      makeTask('t5', 'pending'),
    ])
    render(<ProgressBar schedule={schedule} />)
    expect(screen.getByTestId('progress-percent')).toHaveTextContent('0%')
  })

  it('shows 100% when all tasks are complete', () => {
    const schedule = makeSchedule([
      makeTask('t1', 'complete'),
      makeTask('t2', 'complete'),
      makeTask('t3', 'complete'),
    ])
    render(<ProgressBar schedule={schedule} />)
    expect(screen.getByTestId('progress-percent')).toHaveTextContent('100%')
  })

  it('shows 30% and "3 / 10 complete" for 3 of 10 tasks done', () => {
    const tasks = [
      makeTask('t1', 'complete'),
      makeTask('t2', 'complete'),
      makeTask('t3', 'complete'),
      ...Array.from({ length: 7 }, (_, i) => makeTask(`p${i}`, 'pending')),
    ]
    render(<ProgressBar schedule={makeSchedule(tasks)} />)
    expect(screen.getByTestId('progress-percent')).toHaveTextContent('30%')
    expect(screen.getByTestId('progress-text')).toHaveTextContent('3 / 10 complete')
  })

  it('shows skipped count when > 0 and hides it when 0', () => {
    const withSkipped = makeSchedule([
      makeTask('t1', 'complete'),
      makeTask('t2', 'skipped'),
      makeTask('t3', 'pending'),
    ])
    const { rerender } = render(<ProgressBar schedule={withSkipped} />)
    expect(screen.getByTestId('skipped-count')).toHaveTextContent('1 skipped')

    const noSkipped = makeSchedule([
      makeTask('t1', 'complete'),
      makeTask('t2', 'pending'),
    ])
    rerender(<ProgressBar schedule={noSkipped} />)
    expect(screen.queryByTestId('skipped-count')).not.toBeInTheDocument()
  })

  it('progress bar fill div has the correct width style', () => {
    const tasks = [
      makeTask('t1', 'complete'),
      makeTask('t2', 'complete'),
      makeTask('t3', 'pending'),
      makeTask('t4', 'pending'),
    ]
    render(<ProgressBar schedule={makeSchedule(tasks)} />)
    expect(screen.getByTestId('progress-bar-fill')).toHaveStyle({ width: '50%' })
  })
})
