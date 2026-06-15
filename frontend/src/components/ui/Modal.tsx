import { useEffect, type ReactNode } from 'react'
import Button from './Button'

interface Props {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        data-testid={panelTestId}
        className="w-full max-w-[600px] bg-bg-elevated border border-border-default rounded-xl shadow-elevated flex flex-col animate-fade-in max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex justify-between items-center py-5 border-b border-border-default flex-shrink-0"
          style={{ paddingLeft: '40px', paddingRight: '40px' }}
        >
          <h2 data-testid={titleTestId} className="text-text-primary font-semibold">{title}</h2>
          <Button data-testid={closeTestId} variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            ✕
          </Button>
        </div>
        <div
          className="py-6 overflow-y-auto flex-1"
          style={{ paddingLeft: '40px', paddingRight: '40px' }}
        >{children}</div>
      </div>
    </div>
  )
}
