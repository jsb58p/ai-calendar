import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Button } from './ui'

interface Props {
  message: string | null
  onDismiss: () => void
  durationMs?: number
  children?: ReactNode
}

export function Toast({ message, onDismiss, durationMs = 6000, children }: Props) {
  useEffect(() => {
    if (!message) return
    const id = setTimeout(onDismiss, durationMs)
    return () => clearTimeout(id)
  }, [message, onDismiss, durationMs])

  if (!message) return null

  return (
    <div
      data-testid="toast"
      className="fixed bottom-6 right-6 z-[100] w-[380px] max-w-[calc(100vw-3rem)] bg-bg-elevated border border-border-default rounded-xl shadow-elevated animate-fade-in"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center text-xs flex-shrink-0">
            ✓
          </span>
          <p className="text-text-primary text-sm font-medium flex-1 leading-snug">
            {message}
          </p>
          <Button
            data-testid="toast-dismiss"
            variant="ghost"
            size="sm"
            aria-label="Dismiss notification"
            onClick={onDismiss}
          >
            ✕
          </Button>
        </div>

        {children && (
          <div className="border-t border-border-default mt-3 pt-3">
            {children}
          </div>
        )}

        <div className="h-0.5 bg-border-default rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-accent rounded-full"
            style={{ animation: `shrink ${durationMs}ms linear forwards` }}
          />
        </div>
      </div>
    </div>
  )
}
