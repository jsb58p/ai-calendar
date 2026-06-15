import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { EmailVerified } from '../components/Auth/EmailVerified'

beforeEach(() => {
  // Reset location so navigation tests start clean
  delete (window as Record<string, unknown>).location
  ;(window as Record<string, unknown>).location = { href: '' }
})

describe('EmailVerified', () => {
  it('renders the email-verified page', () => {
    render(<EmailVerified />)
    expect(screen.getByTestId('email-verified-page')).toBeInTheDocument()
  })

  it('shows "Email Verified!" heading', () => {
    render(<EmailVerified />)
    expect(screen.getByRole('heading', { name: /email verified/i })).toBeInTheDocument()
  })

  it('shows descriptive text about the account being verified', () => {
    render(<EmailVerified />)
    expect(screen.getByText(/your account is verified/i)).toBeInTheDocument()
  })

  it('continue button navigates to /', () => {
    render(<EmailVerified />)
    fireEvent.click(screen.getByTestId('continue-button'))
    expect(window.location.href).toBe('/')
  })
})
