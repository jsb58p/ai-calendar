import { Text, View } from 'react-native'

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-bg-base items-center justify-center">
      <Text className="text-text-primary text-lg font-medium">Home</Text>
      <Text className="text-text-secondary text-sm mt-1">Goal input & today's tasks</Text>
    </View>
  )
}
