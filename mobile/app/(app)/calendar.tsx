import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CalendarScreen } from '../../components/Calendar/CalendarScreen'
import { useAppStore } from '../../store/useAppStore'

export default function CalendarTab() {
  const activeGoalId = useAppStore((s) => s.activeGoalId)
  const schedules    = useAppStore((s) => s.schedules)

  const activeSchedule = activeGoalId ? (schedules[activeGoalId] ?? null) : null

  if (!activeSchedule) {
    return (
      <View className="flex-1 bg-bg-base items-center justify-center px-8">
        <Text className="text-text-muted text-base text-center leading-7">
          No active goal.{'\n'}Create or open a goal from the{' '}
          <Text className="text-accent font-medium">Home</Text>
          {' '}tab.
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-bg-base">
      <SafeAreaView edges={['top']} className="bg-bg-base" />
      <CalendarScreen schedule={activeSchedule} />
    </View>
  )
}
