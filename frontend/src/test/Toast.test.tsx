import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Toast } from '../components/Toast'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders message text when message is not null', () => {
    render(<Toast message="Schedule updated!" onDismiss={vi.fn()} />)
    expect(screen.getByTestId('toast')).toHaveTextContent('Schedule updated!')
  })

  it('returns null when message is null', () => {
    render(<Toast message={null} onDismiss={vi.fn()} />)
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
  })

  it('clicking the dismiss button calls onDismiss', () => {
    const onDismiss = vi.fn()
    render(<Toast message="Hello" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByTestId('toast-dismiss'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('calls onDismiss after durationMs milliseconds', () => {
    const onDismiss = vi.fn()
    render(<Toast message="Auto-dismiss me" onDismiss={onDismiss} durationMs={3000} />)
    expect(onDismiss).not.toHaveBeenCalled()
    vi.advanceTimersByTime(3000)
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
