import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { submitFeedback } from '../../api/client'
import { StarRating } from './StarRating'
import { computeDiff } from '../../utils/diff'
import type { FeedbackEntry } from '../../types'
import Modal from '../ui/Modal'
import { Button, Textarea, Divider } from '../ui'

type Scope = 'today' | 'week' | 'all'

const SCOPE_ACTIVE_CLASS = "px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer select-none transition-all duration-150 bg-indigo-600 text-white border-2 border-indigo-500 hover:bg-indigo-500 active:scale-95"
const SCOPE_INACTIVE_CLASS = "px-4 py-2 rounded-lg text-sm font-medium cursor-pointer select-none transition-all duration-150 bg-zinc-800 text-zinc-400 border-2 border-zinc-700 hover:bg-zinc-700 hover:text-white active:scale-95"

export function FeedbackModal() {
  const isFeedbackModalOpen  = useAppStore((s) => s.isFeedbackModalOpen)
  const setFeedbackModalOpen = useAppStore((s) => s.setFeedbackModalOpen)
  const activeGoalId         = useAppStore((s) => s.activeGoalId)
  const schedules            = useAppStore((s) => s.schedules)
  const addFeedback          = useAppStore((s) => s.addFeedback)
  const setSchedule          = useAppStore((s) => s.setSchedule)
  const setLoading           = useAppStore((s) => s.setLoading)
  const setError             = useAppStore((s) => s.setError)
  const isLoading            = useAppStore((s) => s.isLoading)
  const error                = useAppStore((s) => s.error)
  const setToastMessage      = useAppStore((s) => s.setToastMessage)
  const setToastDiffs        = useAppStore((s) => s.setToastDiffs)

  const [rating, setRating] = useState<number | null>(null)
  const [notes, setNotes]   = useState('')
  const [scope, setScope]   = useState<Scope>('week')

  const activeSchedule = activeGoalId ? (schedules[activeGoalId] ?? null) : null

  useEffect(() => {
    if (isFeedbackModalOpen) {
      setRating(null)
      setNotes('')
      setScope('week')
    }
  }, [isFeedbackModalOpen])

  function handleClose() {
    setFeedbackModalOpen(false)
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
      const diffs = computeDiff(activeSchedule, result.adapted)
      const entry: FeedbackEntry = {
        id: crypto.randomUUID(),
        scheduleId: activeSchedule.goalId,
        rating: rating as FeedbackEntry['rating'],
        notes,
        createdAt: new Date().toISOString(),
      }
      setSchedule(result.adapted)
      addFeedback(entry)
      setToastDiffs(diffs)
      setFeedbackModalOpen(false)
      setToastMessage(result.changesExplained)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isFeedbackModalOpen}
      onClose={handleClose}
      title="How's your schedule working?"
      backdropTestId="modal-backdrop"
      panelTestId="modal-panel"
      titleTestId="modal-title"
      closeTestId="modal-close-button"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Rating */}
        <div data-testid="star-rating-section" className="mb-5">
          <p className="text-text-secondary text-sm mb-3">Rate your current schedule</p>
          <StarRating value={rating ?? 0} onChange={setRating} />
        </div>

        <Divider label="FEEDBACK" className="mb-5" />

        {/* Notes */}
        <div className="mb-5">
          <Textarea
            data-testid="notes-input"
            label="What's working? What isn't?"
            id="feedback-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What's working? What isn't? Any specific tasks that need rescheduling?"
            maxLength={1000}
            rows={4}
          />
        </div>

        {/* Scope */}
        <div className="mb-5">
          <p className="text-text-secondary text-sm mb-3">Adapt which part of the plan?</p>
          <div className="flex gap-3 mt-2">
            <button type="button" className={scope === 'today' ? SCOPE_ACTIVE_CLASS : SCOPE_INACTIVE_CLASS} onClick={() => setScope('today')} data-testid="scope-today">Today</button>
            <button type="button" className={scope === 'week'  ? SCOPE_ACTIVE_CLASS : SCOPE_INACTIVE_CLASS} onClick={() => setScope('week')}  data-testid="scope-week">This Week</button>
            <button type="button" className={scope === 'all'   ? SCOPE_ACTIVE_CLASS : SCOPE_INACTIVE_CLASS} onClick={() => setScope('all')}   data-testid="scope-all">Entire Plan</button>
          </div>
        </div>

        {/* Error */}
        {error !== null && (
          <div
            data-testid="modal-error"
            className="mb-4 bg-danger/10 border border-danger/30 rounded-lg p-3 text-danger text-sm"
          >
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-1">
          <Button
            data-testid="cancel-button"
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            data-testid="submit-feedback-button"
            type="submit"
            variant="primary"
            size="md"
            disabled={!rating || isLoading}
            loading={isLoading}
          >
            Adapt My Schedule
          </Button>
        </div>
      </form>
    </Modal>
  )
}
