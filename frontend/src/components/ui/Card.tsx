import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  hoverable?: boolean
}

export default function Card({ children, className = '', onClick, hoverable = false, ...rest }: Props) {
  return (
    <div
      onClick={onClick}
      {...rest}
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
