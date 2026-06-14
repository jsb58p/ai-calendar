import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useAppStore } from '../../store/useAppStore'

const PREVIEW_LIMIT = 100

function renderStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}

export function FeedbackHistory() {
  const feedback = useAppStore((s) => s.feedback)
  const activeGoalId = useAppStore((s) => s.activeGoalId)

  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const entries = feedback
    .filter((f) => f.scheduleId === activeGoalId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (entries.length === 0) {
    return (
      <p data-testid="no-feedback-message">
        No feedback yet. Submit your first review to adapt your schedule.
      </p>
    )
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div>
      {entries.map((entry, index) => {
        const isLong = entry.notes.length > PREVIEW_LIMIT
        const isExpanded = expanded.has(entry.id)

        return (
          <div
            key={entry.id}
            data-testid={`feedback-entry-${index}`}
            style={{
              padding: '12px 0',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span data-testid="entry-date" style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                {format(parseISO(entry.createdAt), 'EEEE, MMMM d')}
              </span>
              <span data-testid="entry-rating" style={{ fontSize: '14px', color: '#f59e0b', letterSpacing: '1px' }}>
                {renderStars(entry.rating)}
              </span>
            </div>

            <p data-testid="entry-notes-preview" style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0' }}>
              {isLong && !isExpanded ? entry.notes.slice(0, PREVIEW_LIMIT) + '...' : entry.notes}
            </p>

            {isExpanded && (
              <p data-testid="entry-notes-full" style={{ fontSize: '13px', color: '#374151', margin: '4px 0' }}>
                {entry.notes}
              </p>
            )}

            {isLong && !isExpanded && (
              <button
                data-testid="expand-button"
                onClick={() => toggle(entry.id)}
                style={{ fontSize: '12px', color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Show more
              </button>
            )}

            {isLong && isExpanded && (
              <button
                data-testid="collapse-button"
                onClick={() => toggle(entry.id)}
                style={{ fontSize: '12px', color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Show less
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
