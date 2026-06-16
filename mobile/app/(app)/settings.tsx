import { useState } from 'react'
import {
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useRouter } from 'expo-router'
import { Header } from '../../components/Header'
import { ScreenWrapper } from '../../components/ScreenWrapper'
import { Button } from '../../components/ui/Button'
import { ErrorBanner } from '../../components/ErrorBanner'
import { FeedbackHistory } from '../../components/Feedback/FeedbackHistory'
import { logout as logoutApi, syncAllTasks } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'
import { useGoogleCalendarAuth } from '../../hooks/useGoogleCalendarAuth'
import type { UserSettings } from '../../types'

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const HOURS = Array.from({ length: 17 }, (_, i) => {
  const h = i + 6 // 6 = 6 AM, 22 = 10 PM
  const period = h >= 12 ? 'PM' : 'AM'
  const display = h > 12 ? h - 12 : h
  return {
    value: `${String(h).padStart(2, '0')}:00`,
    label: `${display}:00 ${period}`,
  }
})

const DIFFICULTY_OPTIONS: { value: UserSettings['difficultyRamp']; label: string }[] = [
  { value: 'easy-to-hard', label: 'Easy → Hard' },
  { value: 'flat',         label: 'Consistent' },
  { value: 'hard-to-easy', label: 'Hard → Easy' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h = parseInt(hStr, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${display}:${mStr} ${period}`
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-text-muted text-xs font-mono uppercase tracking-wider mb-3">
      {title}
    </Text>
  )
}

function Divider() {
  return <View className="h-px bg-border-default my-6" />
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router    = useRouter()
  const currentUser    = useAppStore((s) => s.currentUser)
  const settings       = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const storeLogout    = useAppStore((s) => s.logout)
  const setToastMessage = useAppStore((s) => s.setToastMessage)
  const activeGoalId   = useAppStore((s) => s.activeGoalId)
  const googleTokens   = useAppStore((s) => s.googleTokens)

  const { promptAsync, request, calendarEnabled, isConnected, disconnect } =
    useGoogleCalendarAuth()

  // Local form — only persisted on Save
  const [form, setForm]       = useState<UserSettings>({ ...settings })
  const [minDurStr, setMinDurStr] = useState(String(settings.minTaskDuration))
  const [maxDurStr, setMaxDurStr] = useState(String(settings.maxTaskDuration))
  const [durationError, setDurationError] = useState<string | null>(null)
  const [signingOut, setSigningOut]       = useState(false)
  const [syncing,    setSyncing]          = useState(false)

  // Time picker modal
  const [timeTarget, setTimeTarget] = useState<'start' | 'end' | null>(null)

  // Date picker for blackout dates
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [pickerDate, setPickerDate]         = useState(() => new Date())

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await logoutApi()
    } catch {
      // clear local state even if the API call fails
    } finally {
      storeLogout()
      router.replace('/(auth)/login' as never)
    }
  }

  function toggleDay(day: number) {
    setForm((f) => ({
      ...f,
      availableDays: f.availableDays.includes(day)
        ? f.availableDays.filter((d) => d !== day)
        : [...f.availableDays, day].sort((a, b) => a - b),
    }))
  }

  function selectTime(value: string) {
    if (!timeTarget) return
    setForm((f) => ({
      ...f,
      [timeTarget === 'start' ? 'dailyStartTime' : 'dailyEndTime']: value,
    }))
    setTimeTarget(null)
  }

  function addBlackoutDate(date: Date) {
    const str = date.toISOString().split('T')[0]
    if (!form.blackoutDates.includes(str)) {
      setForm((f) => ({
        ...f,
        blackoutDates: [...f.blackoutDates, str].sort(),
      }))
    }
  }

  function removeBlackoutDate(dateStr: string) {
    setForm((f) => ({
      ...f,
      blackoutDates: f.blackoutDates.filter((d) => d !== dateStr),
    }))
  }

  function handleDateChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setShowDatePicker(false)
      if (event.type === 'set' && date) addBlackoutDate(date)
    } else {
      if (date) setPickerDate(date)
    }
  }

  function handleSave() {
    const min = parseInt(minDurStr, 10)
    const max = parseInt(maxDurStr, 10)
    if (isNaN(min) || min < 5) {
      setDurationError('Min duration must be at least 5 minutes')
      return
    }
    if (isNaN(max) || max > 480) {
      setDurationError('Max duration must be 480 minutes or less')
      return
    }
    if (min >= max) {
      setDurationError('Min duration must be less than max duration')
      return
    }
    setDurationError(null)
    updateSettings({ ...form, minTaskDuration: min, maxTaskDuration: max })
    setToastMessage('Settings saved')
  }

  async function handleSyncCalendar() {
    if (!activeGoalId || !googleTokens) return
    setSyncing(true)
    try {
      const { synced } = await syncAllTasks(activeGoalId, googleTokens)
      setToastMessage(`Synced ${synced} task${synced !== 1 ? 's' : ''} to Google Calendar`)
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const currentTimeValue = timeTarget === 'start' ? form.dailyStartTime : form.dailyEndTime

  return (
    <>
      <Header title="Settings" />
      <ScreenWrapper scrollable>
        <View className="px-4 py-6">

          {/* ── Account ────────────────────────────────────────────────── */}
          <SectionHeader title="Account" />
          <View className="bg-bg-surface border border-border-default rounded-xl p-4 mb-4">
            <Text className="text-text-primary font-medium text-base">
              {currentUser?.displayName ?? '—'}
            </Text>
            <Text className="text-text-secondary text-sm mt-0.5">
              {currentUser?.email ?? '—'}
            </Text>
          </View>
          <Button
            variant="danger"
            onPress={handleSignOut}
            loading={signingOut}
            className="self-start"
          >
            <Text className="text-danger text-sm font-medium">Sign Out</Text>
          </Button>

          <Divider />

          {/* ── Available Days ─────────────────────────────────────────── */}
          <SectionHeader title="Available Days" />
          <View className="flex-row flex-wrap gap-2">
            {DAY_LABELS.map((label, idx) => {
              const active = form.availableDays.includes(idx)
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => toggleDay(idx)}
                  className={`px-3 py-2 rounded-lg border ${
                    active
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-zinc-800 border-border-default'
                  }`}
                >
                  <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-text-secondary'}`}>
                    {label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Divider />

          {/* ── Daily Availability ─────────────────────────────────────── */}
          <SectionHeader title="Daily Availability Window" />
          <View className="gap-3">
            {(['start', 'end'] as const).map((target) => {
              const isStart  = target === 'start'
              const timeVal  = isStart ? form.dailyStartTime : form.dailyEndTime
              return (
                <TouchableOpacity
                  key={target}
                  onPress={() => setTimeTarget(target)}
                  className="bg-bg-surface border border-border-default rounded-xl px-4 py-3 flex-row items-center justify-between"
                >
                  <Text className="text-text-secondary text-sm">
                    {isStart ? 'Start' : 'End'}
                  </Text>
                  <Text className="text-text-primary font-mono text-sm">
                    {formatTime(timeVal)}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Divider />

          {/* ── Task Duration ──────────────────────────────────────────── */}
          <SectionHeader title="Task Duration" />
          <View className="gap-3">
            {(
              [
                { label: 'Min duration', str: minDurStr, set: setMinDurStr },
                { label: 'Max duration', str: maxDurStr, set: setMaxDurStr },
              ] as const
            ).map(({ label, str, set }) => (
              <View key={label} className="flex-row items-center justify-between bg-bg-surface border border-border-default rounded-xl px-4 py-3">
                <Text className="text-text-secondary text-sm">{label}</Text>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={str}
                    onChangeText={set}
                    keyboardType="numeric"
                    className="text-text-primary font-mono text-sm text-right w-14 bg-bg-muted border border-border-default rounded-lg px-2 py-1"
                    maxLength={3}
                    selectTextOnFocus
                    placeholderTextColor="#5a5a72"
                  />
                  <Text className="text-text-muted text-sm">min</Text>
                </View>
              </View>
            ))}
          </View>
          {durationError && (
            <Text className="text-danger text-xs mt-2">{durationError}</Text>
          )}

          <Divider />

          {/* ── Difficulty Progression ─────────────────────────────────── */}
          <SectionHeader title="Difficulty Progression" />
          <View className="flex-row gap-2">
            {DIFFICULTY_OPTIONS.map(({ value, label }) => {
              const active = form.difficultyRamp === value
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setForm((f) => ({ ...f, difficultyRamp: value }))}
                  className={`flex-1 px-3 py-2.5 rounded-lg border items-center ${
                    active
                      ? 'bg-indigo-600 border-indigo-600'
                      : 'bg-zinc-800 border-border-default'
                  }`}
                >
                  <Text className={`text-xs font-medium text-center ${active ? 'text-white' : 'text-text-secondary'}`}>
                    {label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Divider />

          {/* ── Blackout Dates ─────────────────────────────────────────── */}
          <SectionHeader title="Blackout Dates" />
          {form.blackoutDates.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-3">
              {form.blackoutDates.map((dateStr) => (
                <View
                  key={dateStr}
                  className="flex-row items-center bg-bg-muted border border-border-default rounded-lg px-3 py-1.5 gap-2"
                >
                  <Text className="text-text-secondary text-sm">{formatDate(dateStr)}</Text>
                  <TouchableOpacity onPress={() => removeBlackoutDate(dateStr)} hitSlop={6}>
                    <Text className="text-text-muted text-sm leading-none">×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <Button variant="secondary" onPress={() => setShowDatePicker(true)} className="self-start">
            <Text className="text-text-secondary text-sm">+ Add Date</Text>
          </Button>

          {/* Android date picker renders as a dialog directly */}
          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          <Divider />

          {/* ── Save ───────────────────────────────────────────────────── */}
          <Button variant="primary" size="lg" onPress={handleSave}>
            <Text className="text-white font-semibold text-base">Save Settings</Text>
          </Button>

          <Divider />

          {/* ── Google Calendar ────────────────────────────────────────── */}
          <SectionHeader title="Google Calendar" />
          {!calendarEnabled ? (
            <Text className="text-text-muted text-sm">
              Google credentials are not configured for this build.
            </Text>
          ) : isConnected ? (
            <View className="gap-3">
              <View className="bg-bg-surface border border-border-default rounded-xl px-4 py-3 flex-row items-center gap-3">
                <Text className="text-success text-base">📅</Text>
                <Text className="text-text-primary text-sm font-medium flex-1">
                  Calendar Connected
                </Text>
              </View>
              {activeGoalId && (
                <Button
                  variant="secondary"
                  onPress={handleSyncCalendar}
                  loading={syncing}
                >
                  <Text className="text-text-secondary text-sm font-medium">
                    Sync Calendar
                  </Text>
                </Button>
              )}
              <Button variant="danger" onPress={disconnect}>
                <Text className="text-danger text-sm font-medium">Disconnect</Text>
              </Button>
            </View>
          ) : (
            <Button
              variant="secondary"
              onPress={() => promptAsync()}
              disabled={!request}
            >
              <Text className="text-text-secondary text-sm font-medium">
                Connect Google Calendar
              </Text>
            </Button>
          )}

          <Divider />

          {/* ── Feedback History ───────────────────────────────────────── */}
          <SectionHeader title="Feedback History" />
          <FeedbackHistory />

        </View>
      </ScreenWrapper>

      {/* ── Time Picker Modal ────────────────────────────────────────────── */}
      <Modal
        visible={timeTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setTimeTarget(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setTimeTarget(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            className="bg-bg-elevated rounded-t-2xl px-4 pt-4 pb-10"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-text-primary font-medium text-base">
                {timeTarget === 'start' ? 'Start Time' : 'End Time'}
              </Text>
              <TouchableOpacity onPress={() => setTimeTarget(null)}>
                <Text className="text-text-muted text-sm">Done</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {HOURS.map((h) => {
                const active = currentTimeValue === h.value
                return (
                  <TouchableOpacity
                    key={h.value}
                    onPress={() => selectTime(h.value)}
                    className={`px-3 py-2 rounded-lg border ${
                      active
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'bg-bg-muted border-border-default'
                    }`}
                  >
                    <Text className={`text-sm font-mono ${active ? 'text-white' : 'text-text-secondary'}`}>
                      {h.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── iOS Date Picker Modal ─────────────────────────────────────────── */}
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
                <Text className="text-text-primary font-medium text-base">Add Blackout Date</Text>
                <TouchableOpacity
                  onPress={() => {
                    addBlackoutDate(pickerDate)
                    setShowDatePicker(false)
                  }}
                >
                  <Text className="text-accent font-medium text-sm">Add</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                onChange={handleDateChange}
                textColor="#f0f0ff"
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      <ErrorBanner message={durationError} onDismiss={() => setDurationError(null)} />
    </>
  )
}
