import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
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

const SNAP_POINTS = ['50%', '90%']

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
  const sheetRef = useRef<BottomSheetModal>(null)

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

  // Open / close imperatively when taskId changes
  useEffect(() => {
    if (taskId) {
      sheetRef.current?.present()
    } else {
      sheetRef.current?.dismiss()
    }
  }, [taskId])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleStatusChange(status: Task['status']) {
    if (!taskId || !goalId) return
    updateStatusStore(taskId, status)
    patchTaskStatus(goalId, taskId, status).catch(console.error)
    if (status === 'complete') sheetRef.current?.dismiss()
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

  // ── Backdrop ───────────────────────────────────────────────────────────────

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    []
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: '#1a1a2e' }}
      handleIndicatorStyle={{ backgroundColor: '#5a5a72', width: 40 }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {!task ? (
          <View className="py-12 items-center">
            <Text className="text-text-muted text-sm">Loading task…</Text>
          </View>
        ) : (
          <>
            {/* ── Header ────────────────────────────────────────────────────── */}
            <View className="mb-4">
              <Text
                className="text-text-primary font-semibold text-lg mb-3"
                numberOfLines={4}
              >
                {task.title}
              </Text>
              <View className="flex-row items-center gap-3">
                {/* Status badge */}
                <View
                  style={{
                    backgroundColor: `${STATUS_COLOR[task.status]}20`,
                    borderColor: `${STATUS_COLOR[task.status]}40`,
                    borderWidth: 1,
                  }}
                  className="rounded-full px-3 py-1"
                >
                  <Text
                    style={{ color: STATUS_COLOR[task.status] }}
                    className="text-xs font-medium"
                  >
                    {STATUS_LABEL[task.status]}
                  </Text>
                </View>
                <Text className="text-text-muted text-sm font-mono">
                  {task.estimatedMinutes} min
                </Text>
              </View>
            </View>

            {/* ── Meta row ──────────────────────────────────────────────────── */}
            <View className="bg-bg-muted rounded-xl px-4 py-3 mb-5">
              <Text className="text-text-secondary text-xs font-mono">
                {formatDate(task.scheduledDate.split('T')[0]!)}
              </Text>
            </View>

            {/* ── Step-by-step instructions ─────────────────────────────────── */}
            {task.stepInstructions.length > 0 && (
              <View className="mb-5">
                <Text className="text-text-muted text-xs font-mono uppercase tracking-widest mb-3">
                  Steps
                </Text>
                {task.stepInstructions.map((step, i) => {
                  const done = (task.completedSteps ?? []).includes(i)
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleStepToggle(i)}
                      activeOpacity={0.7}
                      className="flex-row items-start gap-3 mb-3"
                    >
                      {/* Checkbox */}
                      <View
                        className="items-center justify-center mt-0.5 flex-shrink-0"
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: done ? '#22c55e' : '#3a3a52',
                          backgroundColor: done ? '#22c55e' : 'transparent',
                        }}
                      >
                        {done && (
                          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', lineHeight: 14 }}>
                            ✓
                          </Text>
                        )}
                      </View>

                      {/* Step text via markdown */}
                      <View style={{ flex: 1, opacity: done ? 0.5 : 1 }}>
                        <Markdown style={MARKDOWN_STYLES}>{step}</Markdown>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            {/* ── Action buttons ─────────────────────────────────────────────── */}
            <View style={{ gap: 10 }}>
              {/* Primary: Mark Complete */}
              {task.status !== 'complete' && (
                <TouchableOpacity
                  onPress={() => handleStatusChange('complete')}
                  activeOpacity={0.85}
                  className="bg-accent rounded-xl py-4 items-center"
                >
                  <Text className="text-white font-semibold text-base">Mark Complete</Text>
                </TouchableOpacity>
              )}

              {/* Secondary row */}
              {(task.status !== 'pending' || task.status !== 'skipped') && (
                <View className="flex-row" style={{ gap: 10 }}>
                  {task.status !== 'pending' && (
                    <TouchableOpacity
                      onPress={() => handleStatusChange('pending')}
                      activeOpacity={0.8}
                      className="flex-1 bg-bg-surface border border-border-default rounded-xl py-3.5 items-center"
                    >
                      <Text className="text-text-primary font-medium text-sm">Mark Incomplete</Text>
                    </TouchableOpacity>
                  )}
                  {task.status !== 'skipped' && (
                    <TouchableOpacity
                      onPress={() => handleStatusChange('skipped')}
                      activeOpacity={0.8}
                      className="flex-1 bg-danger/10 border border-danger/30 rounded-xl py-3.5 items-center"
                    >
                      <Text className="text-danger font-medium text-sm">Skip Task</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Google Calendar sync */}
              {googleTokens && (
                <TouchableOpacity
                  onPress={handleGoogleSync}
                  activeOpacity={0.8}
                  className="border border-border-default rounded-xl py-3.5 items-center"
                >
                  <Text className="text-text-secondary text-sm">Sync to Google Calendar</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}
