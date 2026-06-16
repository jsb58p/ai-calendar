import { Text, View } from 'react-native'
import type { Schedule } from '../types'

interface Props {
  schedule: Schedule
}

export function CalendarScreen({ schedule }: Props) {
  const total     = schedule.tasks.length
  const completed = schedule.tasks.filter((t) => t.status === 'complete').length
  const pending   = schedule.tasks.filter((t) => t.status === 'pending').length

  return (
    <View className="flex-1 bg-bg-base items-center justify-center px-6">
      <Text className="text-text-primary text-xl font-semibold mb-2">Your Schedule</Text>
      <Text className="text-text-secondary text-sm mb-1">
        {completed}/{total} tasks complete · {pending} pending
      </Text>
      <Text className="text-text-muted text-xs mt-8 text-center leading-5">
        Full calendar view coming soon
      </Text>
    </View>
  )
}
