import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type React from 'react'

interface Props {
  children: React.ReactNode
  scrollable?: boolean
  className?: string
}

export function ScreenWrapper({ children, scrollable = false, className = '' }: Props) {
  const inner = scrollable ? (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 ${className}`}>{children}</View>
  )

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-bg-base">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {inner}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
