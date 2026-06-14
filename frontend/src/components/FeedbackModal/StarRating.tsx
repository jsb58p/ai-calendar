import { useState } from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
}

const LABELS: Record<number, string> = {
  1: 'Not helpful',
  2: 'Slightly helpful',
  3: 'Somewhat helpful',
  4: 'Very helpful',
  5: 'Perfect',
}

export function StarRating({ value, onChange }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  const fillUpTo = hovered ?? value

  return (
    <div role="radiogroup" aria-label="Rate your schedule effectiveness" className="flex gap-2 items-center">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= fillUpTo
        return (
          <span
            key={n}
            data-testid={`star-${n}`}
            role="radio"
            aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
            aria-checked={value === n}
            tabIndex={value === n || (value === 0 && n === 1) ? 0 : -1}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            className={[
              'inline-flex items-center justify-center w-8 h-8 text-2xl cursor-pointer',
              'hover:scale-110 transition-transform duration-100',
              filled ? 'star-filled text-warning' : 'star-empty text-bg-muted',
            ].join(' ')}
            style={filled ? { filter: 'drop-shadow(0 0 6px #f59e0b)' } : undefined}
          >
            ★
          </span>
        )
      })}

      {value > 0 && (
        <span className="text-text-muted text-xs ml-2">
          {LABELS[value] ?? ''}
        </span>
      )}
    </div>
  )
}
