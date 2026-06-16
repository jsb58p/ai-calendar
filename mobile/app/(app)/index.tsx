import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LoadingScreen } from '../../components/LoadingScreen'
import { GoalInputScreen } from '../../components/GoalInput/GoalInputScreen'
import { CalendarScreen } from '../../components/Calendar/CalendarScreen'
import { fetchGoals, fetchSchedule } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'

export default function HomeScreen() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const authLoading     = useAppStore((s) => s.authLoading)
  const activeGoalId    = useAppStore((s) => s.activeGoalId)
  const schedules       = useAppStore((s) => s.schedules)
  const setGoals        = useAppStore((s) => s.setGoals)
  const setSchedule     = useAppStore((s) => s.setSchedule)
  const setActiveGoalId = useAppStore((s) => s.setActiveGoalId)

  const [restoring, setRestoring] = useState(false)

  const activeSchedule = activeGoalId ? (schedules[activeGoalId] ?? null) : null

  useEffect(() => {
    if (!isAuthenticated || activeGoalId) return
    setRestoring(true)
    fetchGoals()
      .then(async ({ goals }) => {
        if (goals.length === 0) return
        setGoals(goals)
        const mostRecent = [...goals].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]!
        const schedule = await fetchSchedule(mostRecent.id)
        setSchedule(schedule)
        setActiveGoalId(mostRecent.id)
      })
      .catch(console.error)
      .finally(() => setRestoring(false))
  }, [isAuthenticated])

  if (authLoading || restoring) {
    return <LoadingScreen message="Loading your schedule…" />
  }

  return (
    <View className="flex-1 bg-bg-base">
      {/* Top safe area — GoalInputScreen/CalendarScreen handle bottom/left/right */}
      <SafeAreaView edges={['top']} className="bg-bg-base" />
      {activeSchedule ? (
        <CalendarScreen schedule={activeSchedule} />
      ) : (
        <GoalInputScreen />
      )}
    </View>
  )
}
