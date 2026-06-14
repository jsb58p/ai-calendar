import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useAppStore } from '../../store/useAppStore'
import { Card, Button } from '../ui'

const PREVIEW_LIMIT = 100

function renderStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

export function FeedbackHistory() {
  const feedback     = useAppStore((s) => s.feedback)
  const activeGoalId = useAppStore((s) => s.activeGoalId)

  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const entries = feedback
    .filter((f) => f.scheduleId === activeGoalId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (entries.length === 0) {
    return (
      <div
        data-testid="no-feedback-message"
        className="flex flex-col items-center justify-center h-full gap-3"
      >
        <span className="text-text-muted text-4xl">⏱</span>
        <p className="text-text-muted text-sm text-center">
          No feedback yet. Submit your first review to adapt your schedule.
        </p>
      </div>
    )
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      {entries.map((entry, index) => {
        const isLong     = entry.notes.length > PREVIEW_LIMIT
        const isExpanded = expanded.has(entry.id)

        return (
          <Card
            key={entry.id}
            data-testid={`feedback-entry-${index}`}
            hoverable={false}
            className="mb-3"
          >
            {/* Top row */}
            <div className="flex justify-between items-center mb-2">
              <span data-testid="entry-date" className="font-mono text-xs text-text-muted">
                {format(parseISO(entry.createdAt), 'EEEE, MMMM d')}
              </span>
              <span data-testid="entry-rating" className="font-mono text-xs text-warning">
                {renderStars(entry.rating)}
              </span>
            </div>

            {/* Notes preview */}
            <p data-testid="entry-notes-preview" className="text-text-secondary text-sm leading-relaxed">
              {isLong && !isExpanded ? entry.notes.slice(0, PREVIEW_LIMIT) + '...' : entry.notes}
            </p>

            {/* Full notes (when expanded) */}
            {isExpanded && (
              <p data-testid="entry-notes-full" className="text-text-primary text-sm leading-relaxed mt-1">
                {entry.notes}
              </p>
            )}

            {/* Show more */}
            {isLong && !isExpanded && (
              <Button
                data-testid="expand-button"
                variant="ghost"
                size="sm"
                className="mt-1 text-accent"
                onClick={() => toggle(entry.id)}
              >
                Show more
              </Button>
            )}

            {/* Show less */}
            {isLong && isExpanded && (
              <Button
                data-testid="collapse-button"
                variant="ghost"
                size="sm"
                className="mt-1 text-accent"
                onClick={() => toggle(entry.id)}
              >
                Show less
              </Button>
            )}
          </Card>
        )
      })}
    </div>
  )
}
