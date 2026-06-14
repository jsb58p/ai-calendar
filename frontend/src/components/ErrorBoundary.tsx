import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: '' }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="error-boundary"
          className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center bg-bg-base"
        >
          <h1 className="text-text-primary text-xl font-semibold">Something went wrong</h1>
          {this.state.errorMessage && (
            <p className="text-text-muted text-sm max-w-md">{this.state.errorMessage}</p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-md bg-accent text-white text-sm font-semibold cursor-pointer border-0 hover:opacity-90 transition-opacity"
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
