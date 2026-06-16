import { useEffect, useMemo, useRef } from 'react'
import {
  Animated,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Markdown from 'react-native-markdown-display'
import {
  updateTaskStatus as patchTaskStatus,
  updateStepCompletion as patchStepCompletion,
  syncAllTasks,
} from '../../api/client'
import { useAppStore } from '../../store/useAppStore'
import type { Task } from '../../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<Task['status'], string> = {
  pending:  '#f59e0b',
  complete: '#22c55e',
  skipped:  '#5a5a72',
}

const STATUS_LABEL: Record<Task['status'], string> = {
  pending:  'Pending',
  complete: 'Complete',
  skipped:  'Skipped',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const MARKDOWN_STYLES = {
  body: { color: '#c0c0d8', fontSize: 14, lineHeight: 20 },
  paragraph: { marginTop: 0, marginBottom: 0 },
  strong: { color: '#f0f0ff' },
  code_inline: { color: '#6366f1', backgroundColor: '#16162a', fontSize: 12 },
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  taskId: string | null
  onClose: () => void
}

export function TaskDetailSheet({ taskId, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current

  const schedules         = useAppStore((s) => s.schedules)
  const googleTokens      = useAppStore((s) => s.googleTokens)
  const updateStatusStore = useAppStore((s) => s.updateTaskStatus)
  const updateStepsStore  = useAppStore((s) => s.updateTaskSteps)

  // Find the task and its parent goalId together so we can call the API
  const { task, goalId } = useMemo(() => {
    if (!taskId) return { task: null, goalId: null }
    for (const [gId, schedule] of Object.entries(schedules)) {
      const found = schedule.tasks.find((t) => t.id === taskId)
      if (found) return { task: found, goalId: gId }
    }
    return { task: null, goalId: null }
  }, [taskId, schedules])

  // Subtle scale animation on the panel when it becomes visible
  useEffect(() => {
    if (taskId) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start()
    } else {
      slideAnim.setValue(0)
    }
  }, [taskId])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleStatusChange(status: Task['status']) {
    if (!taskId || !goalId) return
    updateStatusStore(taskId, status)
    patchTaskStatus(goalId, taskId, status).catch(console.error)
    if (status === 'complete') onClose()
  }

  function handleStepToggle(stepIndex: number) {
    if (!task || !goalId) return
    const current = task.completedSteps ?? []
    const next = current.includes(stepIndex)
      ? current.filter((i) => i !== stepIndex)
      : [...current, stepIndex]
    updateStepsStore(task.id, next)
    patchStepCompletion(goalId, task.id, next).catch(console.error)
  }

  function handleGoogleSync() {
    if (!goalId || !googleTokens) return
    syncAllTasks(goalId, googleTokens).catch(console.error)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={taskId !== null}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* ── Backdrop ────────────────────────────────────────────────────────── */}
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* ── Panel ─────────────────────────────────────────────────────────── */}
        <Animated.View
          style={{
            height: '85%',
            backgroundColor: '#1a1a24',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            opacity: slideAnim,
          }}
        >
          {/* Drag handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#5a5a72',
                borderRadius: 2,
              }}
            />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!task ? (
              <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                <Text style={{ color: '#5a5a72', fontSize: 14 }}>Loading task…</Text>
              </View>
            ) : (
              <>
                {/* ── Header ────────────────────────────────────────────────── */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{ color: '#f0f0ff', fontWeight: '600', fontSize: 18, marginBottom: 12 }}
                    numberOfLines={4}
                  >
                    {task.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {/* Status badge */}
                    <View
                      style={{
                        backgroundColor: `${STATUS_COLOR[task.status]}20`,
                        borderColor: `${STATUS_COLOR[task.status]}40`,
                        borderWidth: 1,
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ color: STATUS_COLOR[task.status], fontSize: 12, fontWeight: '500' }}>
                        {STATUS_LABEL[task.status]}
                      </Text>
                    </View>
                    <Text style={{ color: '#5a5a72', fontSize: 14, fontFamily: 'monospace' }}>
                      {task.estimatedMinutes} min
                    </Text>
                  </View>
                </View>

                {/* ── Meta row ──────────────────────────────────────────────── */}
                <View
                  style={{
                    backgroundColor: '#0f0f1a',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    marginBottom: 20,
                  }}
                >
                  <Text style={{ color: '#8888a8', fontSize: 12, fontFamily: 'monospace' }}>
                    {formatDate(task.scheduledDate.split('T')[0]!)}
                  </Text>
                </View>

                {/* ── Step instructions ─────────────────────────────────────── */}
                {task.stepInstructions.length > 0 && (
                  <View style={{ marginBottom: 20 }}>
                    <Text
                      style={{
                        color: '#5a5a72',
                        fontSize: 11,
                        fontFamily: 'monospace',
                        textTransform: 'uppercase',
                        letterSpacing: 1.5,
                        marginBottom: 12,
                      }}
                    >
                      Steps
                    </Text>
                    {task.stepInstructions.map((step, i) => {
                      const done = (task.completedSteps ?? []).includes(i)
                      return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => handleStepToggle(i)}
                          activeOpacity={0.7}
                          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}
                        >
                          {/* Checkbox */}
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              borderWidth: 2,
                              borderColor: done ? '#22c55e' : '#3a3a52',
                              backgroundColor: done ? '#22c55e' : 'transparent',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginTop: 2,
                              flexShrink: 0,
                            }}
                          >
                            {done && (
                              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', lineHeight: 14 }}>
                                ✓
                              </Text>
                            )}
                          </View>

                          {/* Step text */}
                          <View style={{ flex: 1, opacity: done ? 0.5 : 1 }}>
                            <Markdown style={MARKDOWN_STYLES}>{step}</Markdown>
                          </View>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}

                {/* ── Action buttons ────────────────────────────────────────── */}
                <View style={{ gap: 10 }}>
                  {task.status !== 'complete' && (
                    <TouchableOpacity
                      onPress={() => handleStatusChange('complete')}
                      activeOpacity={0.85}
                      style={{
                        backgroundColor: '#6366f1',
                        borderRadius: 12,
                        paddingVertical: 16,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                        Mark Complete
                      </Text>
                    </TouchableOpacity>
                  )}

                  {(task.status !== 'pending' || task.status !== 'skipped') && (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {task.status !== 'pending' && (
                        <TouchableOpacity
                          onPress={() => handleStatusChange('pending')}
                          activeOpacity={0.8}
                          style={{
                            flex: 1,
                            backgroundColor: '#1e1e2e',
                            borderWidth: 1,
                            borderColor: '#2a2a3a',
                            borderRadius: 12,
                            paddingVertical: 14,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#f0f0ff', fontWeight: '500', fontSize: 14 }}>
                            Mark Incomplete
                          </Text>
                        </TouchableOpacity>
                      )}
                      {task.status !== 'skipped' && (
                        <TouchableOpacity
                          onPress={() => handleStatusChange('skipped')}
                          activeOpacity={0.8}
                          style={{
                            flex: 1,
                            backgroundColor: 'rgba(239,68,68,0.1)',
                            borderWidth: 1,
                            borderColor: 'rgba(239,68,68,0.3)',
                            borderRadius: 12,
                            paddingVertical: 14,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#ef4444', fontWeight: '500', fontSize: 14 }}>
                            Skip Task
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {googleTokens && (
                    <TouchableOpacity
                      onPress={handleGoogleSync}
                      activeOpacity={0.8}
                      style={{
                        borderWidth: 1,
                        borderColor: '#2a2a3a',
                        borderRadius: 12,
                        paddingVertical: 14,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: '#8888a8', fontSize: 14 }}>
                        Sync to Google Calendar
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </ScrollView>

          {/* Bottom safe area padding */}
          <SafeAreaView edges={['bottom']} />
        </Animated.View>
      </View>
    </Modal>
  )
}
