import { Text, View } from 'react-native'

export default function CalendarScreen() {
  return (
    <View className="flex-1 bg-bg-base items-center justify-center">
      <Text className="text-text-primary text-lg font-medium">Calendar</Text>
      <Text className="text-text-secondary text-sm mt-1">Full calendar view</Text>
    </View>
  )
}
