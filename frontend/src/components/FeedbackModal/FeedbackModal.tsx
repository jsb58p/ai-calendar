import { useState } from 'react'
import { useCalendarStore } from '../../store'
import { useSubmitFeedback } from '../../hooks'
import { cn } from '../../utils'

export function FeedbackModal() {
  const { activeFeedbackTaskId, setActiveFeedbackTaskId } = useCalendarStore()
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [comment, setComment] = useState('')
  const { mutate: submit, isPending } = useSubmitFeedback()

  if (activeFeedbackTaskId === null) return null

  const taskId = activeFeedbackTaskId

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    submit(
      { taskId, rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          setActiveFeedbackTaskId(null)
          setComment('')
          setRating(3)
        },
      }
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && setActiveFeedbackTaskId(null)}
    >
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-4">How did this task go?</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center gap-2">
            {([1, 2, 3, 4, 5] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRating(r)}
                className={cn(
                  'w-10 h-10 rounded-full border-2 text-sm font-bold transition-colors',
                  rating === r
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Any comments? (optional)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveFeedbackTaskId(null)}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
