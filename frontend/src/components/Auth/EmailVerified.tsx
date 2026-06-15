import { Button } from '../ui'

export function EmailVerified() {
  return (
    <div
      data-testid="email-verified-page"
      className="min-h-screen bg-bg-base flex items-center justify-center"
      style={{ padding: '16px' }}
    >
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div
          className="bg-bg-surface border border-border-default rounded-xl"
          style={{ padding: '40px 32px', textAlign: 'center' }}
        >
          <div
            className="rounded-full flex items-center justify-center mx-auto"
            style={{
              width: '64px',
              height: '64px',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e',
              fontSize: '28px',
              marginBottom: '16px',
            }}
          >
            ✓
          </div>

          <h1
            className="text-text-primary font-semibold text-center"
            style={{ fontSize: '20px', marginBottom: '8px' }}
          >
            Email Verified!
          </h1>

          <p
            className="text-text-secondary text-sm text-center"
            style={{ marginBottom: '24px', lineHeight: '1.6' }}
          >
            Your account is verified. You can now use all features of SchedulerAI.
          </p>

          <Button
            data-testid="continue-button"
            variant="primary"
            className="w-full"
            onClick={() => { window.location.href = '/' }}
          >
            Continue to App
          </Button>
        </div>
      </div>
    </div>
  )
}
