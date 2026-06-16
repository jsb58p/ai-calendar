import { ActivityIndicator, Text, View } from 'react-native'

interface Props {
  message?: string
}

export function LoadingScreen({ message }: Props) {
  return (
    <View className="flex-1 bg-bg-base items-center justify-center gap-6">
      <ActivityIndicator color="#6366f1" size="large" />
      {message && (
        <Text className="text-text-secondary text-sm font-mono">{message}</Text>
      )}
    </View>
  )
}
