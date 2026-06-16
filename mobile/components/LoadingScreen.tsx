import { ActivityIndicator, Text, View } from 'react-native'

interface Props {
  message?: string
  subMessage?: string
}

export function LoadingScreen({ message, subMessage }: Props) {
  return (
    <View className="flex-1 bg-bg-base items-center justify-center gap-6">
      <ActivityIndicator color="#6366f1" size="large" />
      {(message || subMessage) && (
        <View className="items-center gap-2">
          {message && (
            <Text className="text-text-secondary text-sm font-mono">{message}</Text>
          )}
          {subMessage && (
            <Text className="text-text-muted text-xs">{subMessage}</Text>
          )}
        </View>
      )}
    </View>
  )
}
