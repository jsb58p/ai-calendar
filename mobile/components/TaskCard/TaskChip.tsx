import { Text, TouchableOpacity, View } from 'react-native'
import type { Task } from '../../types'

const STATUS_COLOR: Record<Task['status'], string> = {
  pending:  '#f59e0b',
  complete: '#22c55e',
  skipped:  '#5a5a72',
}

interface Props {
  task: Task
  onPress: () => void
}

export function TaskChip({ task, onPress }: Props) {
  const color = STATUS_COLOR[task.status]

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="bg-bg-surface rounded-xl mb-2 flex-row items-center overflow-hidden"
    >
      {/* Left accent bar — colored by status */}
      <View style={{ width: 4, backgroundColor: color }} className="self-stretch" />

      {/* Content */}
      <View className="flex-1 flex-row items-center px-3 py-3 gap-3">
        <View className="flex-1">
          <Text className="text-text-primary text-sm font-medium" numberOfLines={1}>
            {task.title}
          </Text>
          <Text className="text-text-muted text-xs font-mono mt-0.5">
            {task.estimatedMinutes} min
          </Text>
        </View>

        {/* Status dot */}
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      </View>
    </TouchableOpacity>
  )
}
