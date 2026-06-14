import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { submitFeedback } from '../../api/client'
import { StarRating } from './StarRating'
import type { FeedbackEntry } from '../../types'

type Scope = 'today' | 'week' | 'all'

export function FeedbackModal() {
  const isFeedbackModalOpen = useAppStore((s) => s.isFeedbackModalOpen)
  const setFeedbackModalOpen = useAppStore((s) => s.setFeedbackModalOpen)
  const activeGoalId = useAppStore((s) => s.activeGoalId)
  const schedules = useAppStore((s) => s.schedules)
  const addFeedback = useAppStore((s) => s.addFeedback)
  const setSchedule = useAppStore((s) => s.setSchedule)
  const setLoading = useAppStore((s) => s.setLoading)
  const setError = useAppStore((s) => s.setError)
  const isLoading = useAppStore((s) => s.isLoading)
  const error = useAppStore((s) => s.error)

  const [rating, setRating] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [scope, setScope] = useState<Scope>('week')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const activeSchedule = activeGoalId ? (schedules[activeGoalId] ?? null) : null

  // Reset form when modal opens
  useEffect(() => {
    if (isFeedbackModalOpen) {
      setRating(null)
      setNotes('')
      setScope('week')
    }
  }, [isFeedbackModalOpen])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return
    const id = setTimeout(() => setToastMessage(null), 4000)
    return () => clearTimeout(id)
  }, [toastMessage])

  // Keep rendering for toast even after modal closes
  if (!isFeedbackModalOpen) {
    if (!toastMessage) return null
    return <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === null || !activeSchedule) return
    setLoading(true)
    try {
      const result = await submitFeedback({
        scheduleId: activeSchedule.goalId,
        rating,
        notes,
      })
      const entry: FeedbackEntry = {
        id: crypto.randomUUID(),
        scheduleId: activeSchedule.goalId,
        rating: rating as FeedbackEntry['rating'],
        notes,
        createdAt: new Date().toISOString(),
      }
      setSchedule(result.adapted)
      addFeedback(entry)
      setFeedbackModalOpen(false)
      setToastMessage(result.changesExplained)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setFeedbackModalOpen(false)
  }

  const isSubmitDisabled = rating === null || isLoading

  return (
    <>
      {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}

      <div
        data-testid="modal-backdrop"
        onClick={() => setFeedbackModalOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
      >
        <div
          data-testid="modal-panel"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            padding: '32px',
            width: '100%',
            maxWidth: '560px',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2
              data-testid="modal-title"
              style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}
            >
              How&apos;s your schedule working?
            </h2>
            <button
              data-testid="modal-close-button"
              aria-label="Close modal"
              onClick={() => setFeedbackModalOpen(false)}
              style={{
                fontSize: '22px',
                lineHeight: 1,
                padding: '4px 8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#6b7280',
              }}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Star rating */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>
                How effective is your current schedule?
              </p>
              <div data-testid="star-rating-section">
                <StarRating value={rating ?? 0} onChange={setRating} />
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="feedback-notes"
                style={{ fontSize: '14px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}
              >
                Tell us more
              </label>
              <textarea
                id="feedback-notes"
                data-testid="notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What's working? What isn't? Any specific tasks that need rescheduling?"
                maxLength={1000}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Scope */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>
                Adapt which part of the plan?
              </p>
              <div style={{ display: 'flex', gap: '16px' }}>
                {(
                  [
                    { testid: 'scope-today', value: 'today', label: 'Just today' },
                    { testid: 'scope-week', value: 'week', label: 'This week' },
                    { testid: 'scope-all', value: 'all', label: 'Entire plan' },
                  ] as const
                ).map(({ testid, value, label }) => (
                  <label
                    key={value}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}
                  >
                    <input
                      data-testid={testid}
                      type="radio"
                      name="scope"
                      value={value}
                      checked={scope === value}
                      onChange={() => setScope(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Error */}
            {error !== null && (
              <div
                data-testid="modal-error"
                style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '14px',
                }}
              >
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                data-testid="cancel-button"
                type="button"
                onClick={() => setFeedbackModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: 'transparent',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                data-testid="submit-feedback-button"
                type="submit"
                disabled={isSubmitDisabled}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: isSubmitDisabled ? '#e5e7eb' : '#8b5cf6',
                  color: isSubmitDisabled ? '#9ca3af' : '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? 'Adapting…' : 'Adapt My Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      data-testid="feedback-toast"
      onClick={onDismiss}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        maxWidth: '400px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '8px',
        padding: '14px 18px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        zIndex: 200,
        cursor: 'pointer',
        fontSize: '14px',
        color: '#15803d',
      }}
    >
      <strong style={{ display: 'block', marginBottom: '4px' }}>Schedule updated ✓</strong>
      {message}
    </div>
  )
}
