import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { login, register, getGoogleSignInUrl } from '../../api/client'
import { Input, Button } from '../ui'

type Tab = 'signin' | 'register'

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifyBanner, setVerifyBanner] = useState(false)

  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  function switchTab(t: Tab) {
    setTab(t)
    setError('')
    setPasswordError('')
    setVerifyBanner(false)
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { user } = await login({ email, password })
      setCurrentUser(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError('')
    setPasswordError('')
    try {
      const { user } = await register({ email, password, displayName })
      setCurrentUser(user)
      setVerifyBanner(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      data-testid="login-page"
      className="min-h-screen bg-bg-base flex items-center justify-center"
      style={{ padding: '16px' }}
    >
      <div style={{ width: '100%', maxWidth: '360px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '2px' }}>
            <span
              className="font-mono text-text-primary font-semibold"
              style={{ fontSize: '24px', letterSpacing: '-0.5px' }}
            >
              SchedulerAI
            </span>
            <span
              className="bg-accent rounded-full"
              style={{ width: '8px', height: '8px', marginBottom: '6px', flexShrink: 0 }}
            />
          </div>
          <p className="text-text-secondary" style={{ fontSize: '14px', marginTop: '8px' }}>
            Turn goals into adaptive schedules
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-bg-surface border border-border-default rounded-xl"
          style={{ padding: '32px' }}
        >
          {/* Heading */}
          <h2
            className="text-text-primary font-semibold"
            style={{ fontSize: '18px', marginBottom: '24px', textAlign: 'center' }}
          >
            {tab === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </h2>

          {/* Verify success banner */}
          {verifyBanner && (
            <div
              data-testid="verify-banner"
              style={{
                background: '#0f2a1a',
                border: '1px solid #22c55e40',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
              }}
            >
              <p style={{ color: '#22c55e', fontSize: '13px', margin: 0 }}>
                Check your email to verify your address before signing in.
              </p>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div
              data-testid="auth-error"
              style={{
                background: '#2a0f0f',
                border: '1px solid #ef444440',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
              }}
            >
              <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Sign In form */}
          {tab === 'signin' && (
            <form
              onSubmit={handleSignIn}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <Input
                data-testid="email-input"
                label="Email"
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                required
                autoFocus
              />
              <Input
                data-testid="password-input"
                label="Password"
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                required
              />
              <Button
                data-testid="signin-button"
                type="submit"
                variant="primary"
                className="w-full"
                disabled={!email || !password}
                loading={loading}
              >
                Sign In
              </Button>
              <button
                data-testid="signup-link"
                type="button"
                onClick={() => switchTab('register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textAlign: 'center',
                  padding: '4px 0',
                }}
              >
                Don&apos;t have an account? Sign up
              </button>
            </form>
          )}

          {/* Register form */}
          {tab === 'register' && (
            <form
              onSubmit={handleRegister}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <Input
                data-testid="displayname-input"
                label="Display Name"
                id="reg-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoFocus
              />
              <Input
                data-testid="email-input"
                label="Email"
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                required
              />
              <Input
                data-testid="password-input"
                label="Password"
                id="reg-password"
                type="password"
                value={password}
                error={passwordError}
                onChange={(e) => { setPassword(e.target.value); setPasswordError('') }}
                required
              />
              <Input
                data-testid="confirm-password-input"
                label="Confirm Password"
                id="reg-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button
                data-testid="register-button"
                type="submit"
                variant="primary"
                className="w-full"
                loading={loading}
              >
                Create Account
              </Button>
              <button
                data-testid="signin-link"
                type="button"
                onClick={() => switchTab('signin')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textAlign: 'center',
                  padding: '4px 0',
                }}
              >
                Already have an account? Sign in
              </button>
            </form>
          )}

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '20px 0',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: '#2a2a3a' }} />
            <span style={{ color: '#64748b', fontSize: '12px' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#2a2a3a' }} />
          </div>

          {/* Google Sign-In */}
          <button
            data-testid="google-signin-button"
            onClick={() => { window.location.href = getGoogleSignInUrl() }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px',
              background: '#22222e',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2a3a' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#22222e' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}
