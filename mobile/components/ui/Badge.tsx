import { Text, View } from 'react-native'
import type React from 'react'

interface Props {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  children: React.ReactNode
}

const variantClasses: Record<NonNullable<Props['variant']>, { view: string; text: string }> = {
  default: { view: 'bg-bg-muted',      text: 'text-text-secondary' },
  success: { view: 'bg-success/10',    text: 'text-success' },
  warning: { view: 'bg-warning/10',    text: 'text-warning' },
  danger:  { view: 'bg-danger/10',     text: 'text-danger' },
  info:    { view: 'bg-info/10',       text: 'text-info' },
}

export function Badge({ variant = 'default', children }: Props) {
  const { view, text } = variantClasses[variant]

  return (
    <View className={`${view} px-2 py-0.5 rounded self-start`}>
      <Text className={`${text} text-xs font-medium font-mono`}>{children}</Text>
    </View>
  )
}
