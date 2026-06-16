import { useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { submitFeedback } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'

// ─── Types ────────────────────────────────────────────────────────────────────

type Scope = 'today' | 'week' | 'all'

const SCOPE_LABELS: Record<Scope, string> = {
  today: 'Today',
  week:  'This Week',
  all:   'Entire Plan',
}

const SCOPES: Scope[] = ['today', 'week', 'all']

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarRow({ rating, onChange }: { rating: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginVertical: 16 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onChange(star)}
          // 44pt minimum touch target per iOS HIG / Android guidelines
          style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 36, color: star <= rating ? '#fbbf24' : '#3a3a52' }}>
            {star <= rating ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean
  onClose: () => void
}

export function FeedbackModal({ visible, onClose }: Props) {
  const activeGoalId    = useAppStore((s) => s.activeGoalId)
  const setSchedule     = useAppStore((s) => s.setSchedule)
  const setToastMessage = useAppStore((s) => s.setToastMessage)

  const [rating,    setRating]    = useState(0)
  const [notes,     setNotes]     = useState('')
  const [scope,     setScope]     = useState<Scope>('week')
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  function reset() {
    setRating(0)
    setNotes('')
    setScope('week')
    setIsLoading(false)
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (!rating || !activeGoalId) return
    setIsLoading(true)
    setError(null)
    try {
      // Prepend scope so the AI has context about what to adjust
      const scopeLine = `Scope: ${SCOPE_LABELS[scope]}`
      const fullNotes = notes.trim()
        ? `${scopeLine}\n\n${notes.trim()}`
        : scopeLine

      const result = await submitFeedback({
        scheduleId: activeGoalId,
        rating,
        notes: fullNotes,
      })

      setSchedule(result.adapted)
      setToastMessage(result.changesExplained)
      reset()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adapt schedule')
      setIsLoading(false)
    }
  }

  const canSubmit = rating > 0 && !isLoading

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 16 }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          activeOpacity={1}
          onPress={handleClose}
        />

        {/* Card */}
        <View
          style={{
            backgroundColor: '#16162a',
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: '#2a2a3a',
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Title */}
            <Text style={{ color: '#f0f0ff', fontWeight: '600', fontSize: 18, textAlign: 'center' }}>
              How's your schedule working?
            </Text>
            <Text style={{ color: '#8888a8', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
              Rate your experience and we'll adapt the plan.
            </Text>

            {/* Stars */}
            <StarRow rating={rating} onChange={setRating} />

            {/* Scope pills */}
            <Text style={{ color: '#5a5a72', fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
              Adjust
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {SCOPES.map((s) => {
                const active = scope === s
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setScope(s)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      backgroundColor: active ? '#6366f1' : '#1e1e2e',
                      borderWidth: 1,
                      borderColor: active ? '#6366f1' : '#2a2a3a',
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={{ color: active ? '#fff' : '#8888a8', fontSize: 12, fontWeight: active ? '600' : '400' }}>
                      {SCOPE_LABELS[s]}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Notes */}
            <Text style={{ color: '#5a5a72', fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
              Notes (optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="What's working? What isn't?"
              placeholderTextColor="#3a3a52"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                backgroundColor: '#0f0f1a',
                borderWidth: 1,
                borderColor: '#2a2a3a',
                borderRadius: 10,
                padding: 12,
                color: '#f0f0ff',
                fontSize: 14,
                height: 96,
                marginBottom: 20,
              }}
            />

            {/* Inline error */}
            {error && (
              <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <Text style={{ color: '#ef4444', fontSize: 13 }}>{error}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={handleClose}
                activeOpacity={0.75}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#2a2a3a',
                }}
              >
                <Text style={{ color: '#8888a8', fontWeight: '500', fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                activeOpacity={canSubmit ? 0.85 : 1}
                disabled={!canSubmit}
                style={{
                  flex: 2,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: canSubmit ? '#6366f1' : '#2a2a3a',
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: canSubmit ? '#fff' : '#5a5a72', fontWeight: '600', fontSize: 15 }}>
                    Adapt My Schedule
                  </Text>
                )}
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
