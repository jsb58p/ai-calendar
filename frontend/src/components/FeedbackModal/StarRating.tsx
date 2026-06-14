import { useState } from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
}

export function StarRating({ value, onChange }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  const fillUpTo = hovered ?? value

  return (
    <div role="radiogroup" aria-label="Rate your schedule effectiveness" style={{ display: 'flex', gap: '4px' }}>
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
            className={filled ? 'star-filled' : 'star-empty'}
            style={{
              fontSize: '28px',
              cursor: 'pointer',
              color: filled ? '#f59e0b' : '#d1d5db',
              lineHeight: 1,
            }}
          >
            ★
          </span>
        )
      })}
    </div>
  )
}
