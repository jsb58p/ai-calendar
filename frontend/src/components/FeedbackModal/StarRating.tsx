import { useState, useEffect } from 'react'

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
  const [clickedStar, setClickedStar] = useState<number | null>(null)

  const fillUpTo = hovered ?? value

  useEffect(() => {
    if (clickedStar === null) return
    const id = setTimeout(() => setClickedStar(null), 300)
    return () => clearTimeout(id)
  }, [clickedStar])

  function handleClick(n: number) {
    onChange(n)
    setClickedStar(n)
  }

  return (
    <div role="radiogroup" aria-label="Rate your schedule effectiveness" className="flex gap-3 items-center">
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
            onClick={() => handleClick(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            className={[
              'inline-flex items-center justify-center w-10 h-10 text-4xl cursor-pointer',
              'hover:scale-110 transition-transform duration-100',
              filled ? 'star-filled text-yellow-400' : 'star-empty text-zinc-600',
              clickedStar === n ? 'animate-bounce' : '',
            ].join(' ')}
          >
            {filled ? '★' : '☆'}
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
