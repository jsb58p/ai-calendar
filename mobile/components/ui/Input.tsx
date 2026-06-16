import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import type { TextInputProps } from 'react-native'
import type React from 'react'

interface Props extends TextInputProps {
  label?: string
  error?: string
  hint?: string
  rightElement?: React.ReactNode
}

export function Input({ label, error, hint, rightElement, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false)

  return (
    <View className="gap-1">
      {label && (
        <Text className="text-sm font-medium text-text-secondary mb-1">{label}</Text>
      )}
      <View style={rightElement ? { position: 'relative' } : undefined}>
        <TextInput
          placeholderTextColor="#5a5a72"
          {...rest}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          className={`bg-bg-muted rounded-lg px-4 py-3 text-text-primary text-base border ${
            error
              ? 'border-danger'
              : focused
              ? 'border-border-accent'
              : 'border-border-default'
          }`}
          style={rightElement ? { paddingRight: 48 } : undefined}
        />
        {rightElement}
      </View>
      {error && <Text className="text-xs text-danger mt-0.5">{error}</Text>}
      {!error && hint && <Text className="text-xs text-text-muted mt-0.5">{hint}</Text>}
    </View>
  )
}
