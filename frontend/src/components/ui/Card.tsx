import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

export default function Card({ children, className = '', onClick, hoverable = false }: Props) {
  return (
    <div
      onClick={onClick}
      className={[
        'bg-bg-surface border border-border-default rounded-lg p-4 shadow-surface',
        hoverable ? 'hover:border-border-accent hover:shadow-accent cursor-pointer transition-all duration-150' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
