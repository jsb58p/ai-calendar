import { Text, View } from 'react-native'

export default function LoginScreen() {
  return (
    <View className="flex-1 bg-bg-base items-center justify-center px-6">
      <Text className="text-text-primary text-2xl font-semibold">SchedulerAI</Text>
      <Text className="text-text-secondary text-sm mt-2">Sign in to continue</Text>
    </View>
  )
}
