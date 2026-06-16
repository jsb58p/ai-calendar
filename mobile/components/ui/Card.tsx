import { TouchableOpacity, View } from 'react-native'
import type React from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  onPress?: () => void
}

const base = 'bg-bg-surface border border-border-default rounded-xl p-4'

export function Card({ children, className = '', onPress }: Props) {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={`${base} ${className}`}
      >
        {children}
      </TouchableOpacity>
    )
  }

  return <View className={`${base} ${className}`}>{children}</View>
}
