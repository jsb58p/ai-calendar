import { useState } from 'react'
import { Modal, Platform, Text, TouchableOpacity, View } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useRouter } from 'expo-router'
import { ScreenWrapper } from '../ScreenWrapper'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { LoadingScreen } from '../LoadingScreen'
import { submitGoal } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDays(days: number[]): string {
  if (days.length === 0) return 'No days'
  if (days.length === 7) return 'Every day'
  const sorted = [...days].sort((a, b) => a - b)
  const isConsec = sorted.every((d, i) => i === 0 || d === sorted[i - 1]! + 1)
  if (isConsec && sorted.length >= 3) {
    return `${DAY_LABELS[sorted[0]]}–${DAY_LABELS[sorted[sorted.length - 1]]}`
  }
  return sorted.map((d) => DAY_LABELS[d]).join(', ')
}

function formatTime(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h = parseInt(hStr!, 10)
  const period  = h >= 12 ? 'PM' : 'AM'
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${display}:${mStr} ${period}`
}

function formatDisplayDate(date: Date | null): string {
  if (!date) return 'Select target date'
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const MIN_DATE = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d
})()

// ─── Inline error (avoids mx-4 margin conflict inside padded ScrollView) ────

function InlineError({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  if (!message) return null
  return (
    <View className="bg-danger/10 border border-danger/30 rounded-xl p-3 flex-row items-start gap-2">
      <Text className="text-danger text-sm flex-1">{message}</Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={8}>
        <Text className="text-danger text-sm font-medium leading-none">✕</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GoalInputScreen() {
  const router = useRouter()

  const settings       = useAppStore((s) => s.settings)
  const addGoal        = useAppStore((s) => s.addGoal)
  const setSchedule    = useAppStore((s) => s.setSchedule)
  const setActiveGoalId = useAppStore((s) => s.setActiveGoalId)

  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [targetDate, setTargetDate]     = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [pickerDate, setPickerDate]     = useState(() => MIN_DATE)
  const [isLoading, setIsLoading]       = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const isDisabled = !title.trim() || !description.trim() || !targetDate

  const settingsPreview = [
    formatDays(settings.availableDays),
    `${formatTime(settings.dailyStartTime)}–${formatTime(settings.dailyEndTime)}`,
    `${settings.minTaskDuration}–${settings.maxTaskDuration} min`,
  ].join(' · ')

  // ── Date picker ────────────────────────────────────────────────────────────

  function handleDateChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setShowDatePicker(false)
      if (event.type === 'set' && date) {
        setTargetDate(date)
        setPickerDate(date)
      }
    } else {
      if (date) setPickerDate(date)
    }
  }

  function confirmIOSDate() {
    setTargetDate(pickerDate)
    setShowDatePicker(false)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (isDisabled) return
    setIsLoading(true)
    setError(null)
    try {
      const { goal, schedule } = await submitGoal({
        title: title.trim(),
        description: description.trim(),
        targetDate: targetDate!.toISOString().split('T')[0]!,
        settings,
      })
      addGoal(goal)
      setSchedule(schedule)
      setActiveGoalId(goal.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate schedule')
      setIsLoading(false)
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <LoadingScreen
        message="Generating your schedule…"
        subMessage="This may take 15–30 seconds"
      />
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <>
      <ScreenWrapper scrollable>
        <View className="px-4 py-6 gap-6">

          {/* Header */}
          <View className="gap-1">
            <Text className="text-accent font-mono text-xs uppercase tracking-widest">
              New Goal
            </Text>
            <Text className="text-text-primary text-3xl font-semibold mt-1">
              What's your goal?
            </Text>
            <Text className="text-text-secondary text-sm mt-0.5">
              Describe it in plain language.
            </Text>
          </View>

          {/* Settings preview strip */}
          <View className="bg-bg-surface border border-border-default rounded-xl px-4 py-3 flex-row items-center justify-between">
            <Text className="text-text-secondary text-xs flex-1 mr-3" numberOfLines={1}>
              {settingsPreview}
            </Text>
            <TouchableOpacity
              onPress={() => router.navigate('/(app)/settings' as never)}
              hitSlop={8}
            >
              <Text className="text-accent text-xs font-medium">Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Inline error */}
          <InlineError message={error} onDismiss={() => setError(null)} />

          {/* Form fields */}
          <View className="gap-4">
            <Input
              label="Goal title"
              placeholder="e.g. Learn to play guitar in 3 months"
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              maxLength={120}
            />

            <Input
              label="Describe your goal"
              placeholder="What specifically do you want to achieve? Include any relevant context…"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ height: 108 }}
              blurOnSubmit
            />

            {/* Target date */}
            <View>
              <Text className="text-sm font-medium text-text-secondary mb-1">Target date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="bg-bg-muted border border-border-default rounded-lg px-4 py-3 flex-row items-center justify-between"
              >
                <Text className={targetDate ? 'text-text-primary text-base' : 'text-text-muted text-base'}>
                  {formatDisplayDate(targetDate)}
                </Text>
                <Text className="text-text-muted">📅</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <Button
            variant="primary"
            size="lg"
            onPress={handleSubmit}
            disabled={isDisabled}
          >
            <Text className="text-white font-semibold text-base">
              Generate My Schedule →
            </Text>
          </Button>

        </View>
      </ScreenWrapper>

      {/* Android date picker — renders as native dialog */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          minimumDate={MIN_DATE}
          onChange={handleDateChange}
        />
      )}

      {/* iOS date picker — bottom sheet modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="flex-1 bg-black/60 justify-end"
            onPress={() => setShowDatePicker(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              className="bg-bg-elevated rounded-t-2xl px-4 pt-4 pb-10"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-text-primary font-medium">Target Date</Text>
                <TouchableOpacity onPress={confirmIOSDate}>
                  <Text className="text-accent font-medium text-sm">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                minimumDate={MIN_DATE}
                onChange={handleDateChange}
                textColor="#f0f0ff"
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  )
}
