import { useEffect, useState } from 'react'
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Header } from '../../components/Header'
import { LoadingScreen } from '../../components/LoadingScreen'
import { Badge } from '../../components/ui/Badge'
import { fetchGoals, deleteGoal as deleteGoalApi } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'
import type { GoalInput } from '../../types'

// ─── Helper ──────────────────────────────────────────────────────────────────

function formatTargetDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ─── Goal card ───────────────────────────────────────────────────────────────

interface CardProps {
  goal: GoalInput
  isActive: boolean
  completed: number
  total: number
  hasSchedule: boolean
  isDeleting: boolean
  onOpen: () => void
  onDelete: () => void
}

function GoalCard({ goal, isActive, completed, total, hasSchedule, isDeleting, onOpen, onDelete }: CardProps) {
  const allDone = hasSchedule && total > 0 && completed === total

  return (
    <TouchableOpacity
      onPress={onOpen}
      activeOpacity={0.75}
      className={`bg-bg-surface border rounded-xl p-4 mb-3 ${
        isActive ? 'border-accent' : 'border-border-default'
      }`}
    >
      {/* Active pill */}
      {isActive && (
        <View className="flex-row items-center gap-1.5 mb-2">
          <View className="w-1.5 h-1.5 rounded-full bg-accent" />
          <Text className="text-accent text-xs font-mono uppercase tracking-wider">Active</Text>
        </View>
      )}

      {/* Title */}
      <Text className="text-text-primary font-semibold text-base mb-1" numberOfLines={2}>
        {goal.title}
      </Text>

      {/* Target date */}
      <Text className="text-text-muted text-sm font-mono mb-4">
        Target: {formatTargetDate(goal.targetDate)}
      </Text>

      {/* Footer: badge + action buttons */}
      <View className="flex-row items-center justify-between">
        {hasSchedule ? (
          <Badge variant={allDone ? 'success' : 'default'}>
            {completed}/{total} tasks
          </Badge>
        ) : (
          <View />
        )}

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={onOpen}
            className="bg-accent px-3 py-1.5 rounded-lg"
          >
            <Text className="text-white text-xs font-semibold">Open</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            disabled={isDeleting}
            className={`bg-danger/10 border border-danger/30 px-3 py-1.5 rounded-lg ${isDeleting ? 'opacity-50' : ''}`}
          >
            <Text className="text-danger text-xs font-semibold">
              {isDeleting ? '…' : 'Delete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center py-20 px-8">
      <Text className="text-text-muted text-base text-center leading-7">
        No goals yet.{'\n'}Tap the{' '}
        <Text className="text-accent font-medium">Home</Text>
        {' '}tab to create your first goal.
      </Text>
    </View>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function GoalsScreen() {
  const router = useRouter()

  const goals           = useAppStore((s) => s.goals)
  const schedules       = useAppStore((s) => s.schedules)
  const activeGoalId    = useAppStore((s) => s.activeGoalId)
  const setGoals        = useAppStore((s) => s.setGoals)
  const setActiveGoalId = useAppStore((s) => s.setActiveGoalId)
  const clearActiveGoal = useAppStore((s) => s.clearActiveGoal)
  const removeGoal      = useAppStore((s) => s.removeGoal)

  const [loading, setLoading]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchGoals()
      .then(({ goals: fetched }) => setGoals(fetched))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // ── Navigation helpers ──────────────────────────────────────────────────────

  function goHome() {
    router.navigate('/(app)/' as never)
  }

  function handleNewGoal() {
    clearActiveGoal()
    goHome()
  }

  function handleOpen(goalId: string) {
    setActiveGoalId(goalId)
    goHome()
  }

  // ── Delete flow ────────────────────────────────────────────────────────────

  async function handleDelete(goalId: string) {
    setDeleting(goalId)
    try {
      await deleteGoalApi(goalId)
      removeGoal(goalId)
    } catch {
      // silent — goal remains in list if API call fails
    } finally {
      setDeleting(null)
    }
  }

  function confirmDelete(goal: GoalInput) {
    Alert.alert(
      'Delete Goal',
      'This will permanently delete this goal and all its tasks. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(goal.id) },
      ]
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const newGoalButton = (
    <TouchableOpacity onPress={handleNewGoal} hitSlop={8}>
      <Ionicons name="add-circle-outline" size={26} color="#6366f1" />
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <>
        <Header title="My Goals" rightAction={newGoalButton} />
        <LoadingScreen />
      </>
    )
  }

  return (
    <>
      <Header title="My Goals" rightAction={newGoalButton} />
      <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-bg-base">
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const schedule  = schedules[item.id]
            const total     = schedule?.tasks.length ?? 0
            const completed = schedule?.tasks.filter((t) => t.status === 'complete').length ?? 0

            return (
              <GoalCard
                goal={item}
                isActive={item.id === activeGoalId}
                completed={completed}
                total={total}
                hasSchedule={!!schedule}
                isDeleting={deleting === item.id}
                onOpen={() => handleOpen(item.id)}
                onDelete={() => confirmDelete(item)}
              />
            )
          }}
          ListEmptyComponent={<EmptyState />}
        />
      </SafeAreaView>
    </>
  )
}
