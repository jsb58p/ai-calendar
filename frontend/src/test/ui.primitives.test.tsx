import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import { Button, Input, Textarea, Badge, Card } from '../components/ui'

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('primary variant has bg-accent class', () => {
    render(<Button variant="primary">Primary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-accent')
  })

  it('secondary variant has bg-bg-muted class', () => {
    render(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-bg-muted')
  })

  it('danger variant has text-danger class', () => {
    render(<Button variant="danger">Danger</Button>)
    expect(screen.getByRole('button')).toHaveClass('text-danger')
  })

  it('disabled button has opacity-50 class and disabled attribute', () => {
    render(<Button disabled>Disabled</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('opacity-50')
    expect(btn).toBeDisabled()
  })

  it('loading button shows spinner element', () => {
    const { container } = render(<Button loading>Loading</Button>)
    const spinner = container.querySelector('.animate-spin-slow')
    expect(spinner).toBeInTheDocument()
  })

  it('loading button is disabled', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('onClick fires when clicked and not disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
describe('Input', () => {
  it('renders label when label prop provided', () => {
    render(<Input label="Email" id="email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('renders input element', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('error prop renders error text in text-danger color', () => {
    render(<Input error="Required field" />)
    const msg = screen.getByText('Required field')
    expect(msg).toBeInTheDocument()
    expect(msg).toHaveClass('text-danger')
  })

  it('hint prop renders hint text', () => {
    render(<Input hint="Must be at least 8 characters" />)
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument()
  })

  it('className includes focus:border-border-accent', () => {
    render(<Input />)
    expect(screen.getByRole('textbox').className).toContain('focus:border-border-accent')
  })
})

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------
describe('Textarea', () => {
  it('renders label when label prop provided', () => {
    render(<Textarea label="Notes" id="notes" />)
    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
  })

  it('renders textarea element', () => {
    render(<Textarea />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('error prop renders error text in text-danger color', () => {
    render(<Textarea error="Too short" />)
    const msg = screen.getByText('Too short')
    expect(msg).toBeInTheDocument()
    expect(msg).toHaveClass('text-danger')
  })

  it('hint prop renders hint text', () => {
    render(<Textarea hint="Max 500 characters" />)
    expect(screen.getByText('Max 500 characters')).toBeInTheDocument()
  })

  it('className includes focus:border-border-accent', () => {
    render(<Textarea />)
    expect(screen.getByRole('textbox').className).toContain('focus:border-border-accent')
  })
})

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('success variant has text-success class', () => {
    const { container } = render(<Badge variant="success">OK</Badge>)
    expect(container.firstChild).toHaveClass('text-success')
  })

  it('danger variant has text-danger class', () => {
    const { container } = render(<Badge variant="danger">Error</Badge>)
    expect(container.firstChild).toHaveClass('text-danger')
  })

  it('default variant has text-text-secondary class', () => {
    const { container } = render(<Badge>Default</Badge>)
    expect(container.firstChild).toHaveClass('text-text-secondary')
  })
})

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
describe('Card', () => {
  it('renders children', () => {
    render(<Card>Content</Card>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('hoverable card has cursor-pointer class', () => {
    const { container } = render(<Card hoverable>Hoverable</Card>)
    expect(container.firstChild).toHaveClass('cursor-pointer')
  })

  it('onClick fires when card is clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Card hoverable onClick={onClick}>Click me</Card>)
    await user.click(screen.getByText('Click me'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
