import { Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import type React from 'react'

interface Props {
  title?: string
  showBack?: boolean
  rightAction?: React.ReactNode
}

export function Header({ title, showBack = false, rightAction }: Props) {
  const router = useRouter()

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="bg-bg-surface border-b border-border-default">
      <View className="flex-row items-center px-4 h-14">
        <View className="w-10">
          {showBack && (
            <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color="#9090aa" />
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-1 items-center">
          {title && (
            <Text className="text-text-primary font-mono text-base font-medium" numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>

        <View className="w-10 items-end">
          {rightAction}
        </View>
      </View>
    </SafeAreaView>
  )
}
