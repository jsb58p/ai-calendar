import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { TaskCard } from '../components/TaskCard/TaskCard'
import type { Task } from '../types'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    goalId: 'goal-1',
    title: 'Learn C chord',
    description: 'Practice the C major chord until it rings cleanly',
    scheduledDate: '2026-07-01',
    estimatedMinutes: 30,
    status: 'pending',
    stepInstructions: ['Tune guitar', 'Place fingers', 'Strum'],
    ...overrides,
  }
}

describe('TaskCard', () => {
  it('renders the task title', () => {
    render(<TaskCard task={makeTask()} onClick={vi.fn()} />)
    expect(screen.getByTestId('task-title')).toHaveTextContent('Learn C chord')
  })

  it('renders the estimated time as "~N min"', () => {
    render(<TaskCard task={makeTask({ estimatedMinutes: 45 })} onClick={vi.fn()} />)
    expect(screen.getByTestId('task-time')).toHaveTextContent('~45 min')
  })

  it('complete task title has line-through class', () => {
    render(<TaskCard task={makeTask({ status: 'complete' })} onClick={vi.fn()} />)
    expect(screen.getByTestId('task-title')).toHaveClass('line-through')
  })

  it('pending task title does not have line-through class', () => {
    render(<TaskCard task={makeTask({ status: 'pending' })} onClick={vi.fn()} />)
    expect(screen.getByTestId('task-title')).not.toHaveClass('line-through')
  })

  it('complete status dot has green class', () => {
    render(<TaskCard task={makeTask({ status: 'complete' })} onClick={vi.fn()} />)
    expect(screen.getByTestId('status-dot')).toHaveClass('bg-green-500')
  })

  it('pending status dot has orange/yellow class', () => {
    render(<TaskCard task={makeTask({ status: 'pending' })} onClick={vi.fn()} />)
    expect(screen.getByTestId('status-dot')).toHaveClass('bg-yellow-400')
  })

  it('skipped status dot has gray class', () => {
    render(<TaskCard task={makeTask({ status: 'skipped' })} onClick={vi.fn()} />)
    expect(screen.getByTestId('status-dot')).toHaveClass('bg-gray-400')
  })

  it('clicking the card calls onClick with the task object', () => {
    const task = makeTask()
    const handleClick = vi.fn()
    render(<TaskCard task={task} onClick={handleClick} />)
    fireEvent.click(screen.getByTestId('task-card'))
    expect(handleClick).toHaveBeenCalledOnce()
    expect(handleClick).toHaveBeenCalledWith(task)
  })
})
