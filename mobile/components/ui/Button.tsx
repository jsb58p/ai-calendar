import { ActivityIndicator, TouchableOpacity } from 'react-native'
import type React from 'react'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onPress?: () => void
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  primary:   'bg-accent active:bg-accent-hover',
  secondary: 'bg-bg-muted border border-border-default',
  danger:    'bg-danger/10 border border-danger/30',
  ghost:     'active:bg-bg-muted',
}

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2',
  lg: 'px-6 py-3',
}

const indicatorColor: Record<NonNullable<Props['variant']>, string> = {
  primary:   '#f0f0ff',
  secondary: '#9090aa',
  danger:    '#ef4444',
  ghost:     '#9090aa',
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onPress,
  children,
  className = '',
}: Props) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      className={`flex-row items-center justify-center rounded-lg ${variantClasses[variant]} ${sizeClasses[size]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={indicatorColor[variant]}
          className="mr-2"
        />
      )}
      {children}
    </TouchableOpacity>
  )
}
