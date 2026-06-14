import type { ReactNode } from 'react'

interface Props {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  children: ReactNode
}

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  default: 'bg-bg-muted text-text-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger:  'bg-danger/10 text-danger',
  info:    'bg-info/10 text-info',
}

export default function Badge({ variant = 'default', children }: Props) {
  return (
    <span className={`font-mono text-xs font-medium px-2 py-0.5 rounded-sm ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}
