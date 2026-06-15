import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { LoginPage } from '../components/Auth/LoginPage'
import { useAppStore } from '../store/useAppStore'

// ---------------------------------------------------------------------------
// Mock the API client
// ---------------------------------------------------------------------------
vi.mock('../api/client', () => ({
  login: vi.fn().mockResolvedValue({
    user: { id: '1', email: 'test@test.com', displayName: 'Test User', emailVerified: true },
  }),
  register: vi.fn().mockResolvedValue({
    user: { id: '1', email: 'test@test.com', displayName: 'Test User', emailVerified: true },
    message: 'Account created',
  }),
  resendVerification: vi.fn().mockResolvedValue(undefined),
  getGoogleSignInUrl: vi.fn(() => '/api/auth/users/google'),
}))

beforeEach(() => {
  useAppStore.setState({ currentUser: null, isAuthenticated: false })
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Login mode tests
// ---------------------------------------------------------------------------

describe('LoginPage — sign in mode', () => {
  it('test 1: renders "Sign in to your account" heading', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument()
  })

  it('test 2: renders email input', () => {
    render(<LoginPage />)
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
  })

  it('test 3: renders password input', () => {
    render(<LoginPage />)
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
  })

  it('test 4: renders Google Sign-In button', () => {
    render(<LoginPage />)
    expect(screen.getByTestId('google-signin-button')).toBeInTheDocument()
  })

  it('test 5: renders "Don\'t have an account? Sign up" link', () => {
    render(<LoginPage />)
    expect(screen.getByTestId('signup-link')).toBeInTheDocument()
  })

  it('test 6: submit button is disabled when fields are empty', () => {
    render(<LoginPage />)
    expect(screen.getByTestId('signin-button')).toBeDisabled()
  })

  it('test 7: clicking "Sign up" link switches to register mode', () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByTestId('signup-link'))
    expect(screen.getByTestId('register-button')).toBeInTheDocument()
  })

  it('test 8: successful login calls setCurrentUser with user object', async () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByTestId('signin-button'))
    await waitFor(() => {
      expect(useAppStore.getState().currentUser).toEqual({
        id: '1',
        email: 'test@test.com',
        displayName: 'Test User',
        emailVerified: true,
      })
    })
  })

  it('test 9: failed login shows error banner with error message', async () => {
    const { login } = await import('../api/client')
    vi.mocked(login).mockRejectedValueOnce(new Error('Invalid credentials'))
    render(<LoginPage />)
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByTestId('signin-button'))
    await waitFor(() => {
      expect(screen.getByTestId('auth-error')).toHaveTextContent('Invalid credentials')
    })
  })

  it('test 10: error banner disappears when user starts typing again', async () => {
    const { login } = await import('../api/client')
    vi.mocked(login).mockRejectedValueOnce(new Error('Invalid credentials'))
    render(<LoginPage />)
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByTestId('signin-button'))
    await waitFor(() => expect(screen.getByTestId('auth-error')).toBeInTheDocument())
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'new@email.com' } })
    expect(screen.queryByTestId('auth-error')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Register mode tests
// ---------------------------------------------------------------------------

describe('LoginPage — register mode', () => {
  function switchToRegister() {
    render(<LoginPage />)
    fireEvent.click(screen.getByTestId('signup-link'))
  }

  it('test 11: register mode shows display name input', () => {
    switchToRegister()
    expect(screen.getByTestId('displayname-input')).toBeInTheDocument()
  })

  it('test 12: register mode shows confirm password input', () => {
    switchToRegister()
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument()
  })

  it('test 13: passwords not matching shows "Passwords do not match" error', () => {
    switchToRegister()
    fireEvent.change(screen.getByTestId('displayname-input'), { target: { value: 'Test' } })
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'different123' } })
    fireEvent.click(screen.getByTestId('register-button'))
    expect(screen.getByTestId('auth-error')).toHaveTextContent('Passwords do not match')
  })

  it('test 14: password less than 8 chars shows inline error', () => {
    switchToRegister()
    fireEvent.change(screen.getByTestId('displayname-input'), { target: { value: 'Test' } })
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'short' } })
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'short' } })
    fireEvent.click(screen.getByTestId('register-button'))
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
  })

  it('test 15: successful registration shows "Check your email" message', async () => {
    switchToRegister()
    fireEvent.change(screen.getByTestId('displayname-input'), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByTestId('register-button'))
    await waitFor(() => {
      expect(screen.getByTestId('verify-banner')).toHaveTextContent(/check your email/i)
    })
  })

  it('test 16: "Already have an account?" link switches back to login mode', () => {
    switchToRegister()
    fireEvent.click(screen.getByTestId('signin-link'))
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument()
  })
})
