import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  primary:   'bg-accent hover:bg-accent-hover active:scale-95 active:bg-accent-hover text-white font-medium rounded-md transition-all duration-150',
  secondary: 'bg-bg-muted hover:bg-bg-elevated active:scale-95 active:bg-bg-elevated border border-border-default text-text-primary rounded-md transition-all duration-150',
  danger:    'bg-danger/10 hover:bg-danger/20 active:scale-95 active:bg-danger/30 border border-danger/30 text-danger rounded-md transition-all duration-150',
  ghost:     'hover:bg-bg-muted active:scale-95 text-text-secondary hover:text-text-primary rounded-md transition-all duration-150',
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
  children,
  className = '',
  type = 'button',
  ...rest
}: Props) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        'inline-flex items-center gap-2 select-none',
        variantClasses[variant],
        sizeClasses[size],
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading && (
        <span className="animate-spin-slow border-2 border-white/20 border-t-white rounded-full w-4 h-4 inline-block flex-shrink-0" />
      )}
      {children}
    </button>
  )
}
