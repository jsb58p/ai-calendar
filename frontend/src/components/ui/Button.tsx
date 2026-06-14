import type { ReactNode } from 'react'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
  type?: 'button' | 'submit'
}

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  primary:   'bg-accent hover:bg-accent-hover text-white font-medium rounded-md transition-colors duration-150',
  secondary: 'bg-bg-muted hover:bg-bg-elevated border border-border-default text-text-primary rounded-md transition-colors duration-150',
  danger:    'bg-danger/10 hover:bg-danger/20 border border-danger/30 text-danger rounded-md transition-colors duration-150',
  ghost:     'hover:bg-bg-muted text-text-secondary hover:text-text-primary rounded-md transition-colors duration-150',
}

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  children,
  className = '',
  type = 'button',
}: Props) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        'inline-flex items-center gap-2',
        variantClasses[variant],
        sizeClasses[size],
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        className,
      ].join(' ')}
    >
      {loading && (
        <span className="animate-spin-slow border-2 border-white/20 border-t-white rounded-full w-4 h-4 inline-block flex-shrink-0" />
      )}
      {children}
    </button>
  )
}
