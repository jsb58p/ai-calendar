import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, afterEach } from 'vitest'
import { ErrorBoundary } from '../components/ErrorBoundary'

// Component that throws during render when shouldThrow is true
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Render error')
  return <div data-testid="child">OK</div>
}

// React logs caught errors to console.error even when an ErrorBoundary handles
// them. Suppress these so test output stays clean.
function suppressReactErrorLogs() {
  return vi.spyOn(console, 'error').mockImplementation(() => {})
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument()
  })

  it('shows error-boundary div when a child throws', () => {
    const consoleSpy = suppressReactErrorLogs()

    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    )

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Render error')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('Reload Page button calls window.location.reload', async () => {
    const reloadMock = vi.fn()
    vi.stubGlobal('location', { reload: reloadMock })

    const consoleSpy = suppressReactErrorLogs()
    const user = userEvent.setup()

    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    )

    await user.click(screen.getByRole('button', { name: /reload page/i }))
    expect(reloadMock).toHaveBeenCalledOnce()

    consoleSpy.mockRestore()
  })
})
