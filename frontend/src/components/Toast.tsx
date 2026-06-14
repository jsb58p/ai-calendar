import { useEffect } from 'react'
import type { ReactNode } from 'react'

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
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        maxWidth: '420px',
        backgroundColor: '#16a34a',
        color: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        padding: '14px 16px 14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        zIndex: 300,
        fontSize: '14px',
        lineHeight: '1.5',
      }}
    >
      <span style={{ flex: 1 }}>
        {message}
        {children && <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>{children}</div>}
      </span>
      <button
        data-testid="toast-dismiss"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '18px',
          lineHeight: 1,
          padding: '0 2px',
          flexShrink: 0,
          opacity: 0.8,
        }}
      >
        ×
      </button>
    </div>
  )
}
