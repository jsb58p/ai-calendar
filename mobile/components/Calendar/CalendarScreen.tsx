import { useMemo, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Calendar } from 'react-native-calendars'
import type { DateData } from 'react-native-calendars'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { TaskChip } from '../TaskCard/TaskChip'
import { TaskDetailSheet } from '../TaskCard/TaskDetailSheet'
import { useAppStore } from '../../store/useAppStore'
import type { Schedule } from '../../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]!

const THEME = {
  backgroundColor:            '#111118',
  calendarBackground:         '#111118',
  textSectionTitleColor:      '#5a5a72',
  selectedDayBackgroundColor: '#6366f1',
  selectedDayTextColor:       '#ffffff',
  todayTextColor:             '#6366f1',
  dayTextColor:               '#f0f0ff',
  textDisabledColor:          '#2a2a3a',
  arrowColor:                 '#6366f1',
  monthTextColor:             '#f0f0ff',
  indicatorColor:             '#6366f1',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(scheduledDate: string): string {
  return scheduledDate.split('T')[0]!
}

function formatSectionDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  schedule: Schedule
}

export function CalendarScreen({ schedule }: Props) {
  const selectedTaskId    = useAppStore((s) => s.selectedTaskId)
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId)
  const [selectedDate, setSelectedDate] = useState(TODAY)

  // ── Progress stats ─────────────────────────────────────────────────────────

  const { total, completed, pct } = useMemo(() => {
    const total     = schedule.tasks.length
    const completed = schedule.tasks.filter((t) => t.status === 'complete').length
    const pct       = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, pct }
  }, [schedule.tasks])

  // ── markedDates ────────────────────────────────────────────────────────────

  const markedDates = useMemo(() => {
    type Mark = {
      marked?: boolean
      dotColor?: string
      selected?: boolean
      selectedColor?: string
    }
    const marks: Record<string, Mark> = {}

    // Dot for every date that has tasks
    for (const task of schedule.tasks) {
      const d = toDateKey(task.scheduledDate)
      marks[d] = { marked: true, dotColor: '#6366f1' }
    }

    // Today: subtle tint (when it is not the active selection)
    if (selectedDate !== TODAY) {
      marks[TODAY] = {
        ...(marks[TODAY] ?? {}),
        selected: true,
        selectedColor: '#6366f120',
        dotColor: '#6366f1',
      }
    }

    // Active selected day: solid indigo via theme (no selectedColor → uses theme default)
    marks[selectedDate] = {
      ...(marks[selectedDate] ?? {}),
      selected: true,
      // white dot so it stays visible on the solid indigo background
      dotColor: marks[selectedDate]?.marked ? '#ffffff' : '#6366f1',
    }

    return marks
  }, [schedule.tasks, selectedDate])

  // ── Tasks for selected day ─────────────────────────────────────────────────

  const tasksForDate = useMemo(
    () => schedule.tasks.filter((t) => toDateKey(t.scheduledDate) === selectedDate),
    [schedule.tasks, selectedDate]
  )

  function handleDayPress(day: DateData) {
    setSelectedDate(day.dateString)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <BottomSheetModalProvider>
    <View className="flex-1 bg-bg-base">

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      <View className="px-4 pt-3 pb-3 bg-bg-surface border-b border-border-default">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-text-secondary text-xs font-mono">
            {completed}/{total} tasks complete
          </Text>
          <Text className="text-accent text-xs font-mono font-semibold">{pct}%</Text>
        </View>
        <View className="h-1 bg-bg-muted rounded-full overflow-hidden">
          <View
            className="h-full bg-success rounded-full"
            style={{ width: `${pct}%` }}
          />
        </View>
      </View>

      {/* ── Calendar ──────────────────────────────────────────────────────── */}
      <Calendar
        theme={THEME}
        markedDates={markedDates}
        onDayPress={handleDayPress}
        enableSwipeMonths
        hideExtraDays
      />

      <View className="border-t border-border-default" />

      {/* ── Task list for selected date ────────────────────────────────────── */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section header */}
        <Text className="text-text-muted text-xs font-mono uppercase tracking-widest mb-3">
          {tasksForDate.length > 0
            ? `Tasks for ${formatSectionDate(selectedDate)}`
            : 'No tasks scheduled'}
        </Text>

        {/* Tasks */}
        {tasksForDate.length === 0 ? (
          <Text className="text-text-muted text-sm text-center py-6">
            No tasks scheduled for this day.
          </Text>
        ) : (
          tasksForDate.map((task) => (
            <TaskChip
              key={task.id}
              task={task}
              onPress={() => setSelectedTaskId(task.id)}
            />
          ))
        )}
      </ScrollView>

      <TaskDetailSheet
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </View>
    </BottomSheetModalProvider>
  )
}
