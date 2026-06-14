import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { StarRating } from '../components/FeedbackModal/StarRating'

describe('StarRating', () => {
  it('renders 5 stars', () => {
    render(<StarRating value={0} onChange={vi.fn()} />)
    expect(screen.getByTestId('star-1')).toBeInTheDocument()
    expect(screen.getByTestId('star-2')).toBeInTheDocument()
    expect(screen.getByTestId('star-3')).toBeInTheDocument()
    expect(screen.getByTestId('star-4')).toBeInTheDocument()
    expect(screen.getByTestId('star-5')).toBeInTheDocument()
  })

  it('clicking star 3 calls onChange(3)', () => {
    const onChange = vi.fn()
    render(<StarRating value={0} onChange={onChange} />)
    fireEvent.click(screen.getByTestId('star-3'))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('clicking star 5 calls onChange(5)', () => {
    const onChange = vi.fn()
    render(<StarRating value={0} onChange={onChange} />)
    fireEvent.click(screen.getByTestId('star-5'))
    expect(onChange).toHaveBeenCalledWith(5)
  })

  it('with value=4, stars 1-4 have filled class and star 5 does not', () => {
    render(<StarRating value={4} onChange={vi.fn()} />)
    expect(screen.getByTestId('star-1')).toHaveClass('star-filled')
    expect(screen.getByTestId('star-2')).toHaveClass('star-filled')
    expect(screen.getByTestId('star-3')).toHaveClass('star-filled')
    expect(screen.getByTestId('star-4')).toHaveClass('star-filled')
    expect(screen.getByTestId('star-5')).toHaveClass('star-empty')
  })

  it('hovering star 2 adds filled class to stars 1 and 2 regardless of value', () => {
    render(<StarRating value={4} onChange={vi.fn()} />)
    fireEvent.mouseEnter(screen.getByTestId('star-2'))
    expect(screen.getByTestId('star-1')).toHaveClass('star-filled')
    expect(screen.getByTestId('star-2')).toHaveClass('star-filled')
    expect(screen.getByTestId('star-3')).toHaveClass('star-empty')
    expect(screen.getByTestId('star-4')).toHaveClass('star-empty')
    expect(screen.getByTestId('star-5')).toHaveClass('star-empty')
  })
})
