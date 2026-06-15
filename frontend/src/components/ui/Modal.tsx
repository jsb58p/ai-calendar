import { useEffect, type ReactNode } from 'react'
import Button from './Button'

interface Props {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
  backdropTestId?: string
  panelTestId?: string
  titleTestId?: string
  closeTestId?: string
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '600px',
  backdropTestId,
  panelTestId,
  titleTestId,
  closeTestId,
}: Props) {
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      data-testid={backdropTestId}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        data-testid={panelTestId}
        className="bg-bg-elevated border border-border-default rounded-xl shadow-elevated w-full mx-6 animate-fade-in"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-8 py-5 border-b border-border-default">
          <h2 data-testid={titleTestId} className="text-text-primary font-semibold">{title}</h2>
          <Button data-testid={closeTestId} variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            ✕
          </Button>
        </div>
        <div className="px-8 py-6">{children}</div>
      </div>
    </div>
  )
}
