import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  id?: string
  error?: string
  hint?: string
  className?: string
}

export default function Input({ label, id, error, hint, className = '', ...rest }: Props) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="text-text-secondary text-sm font-medium mb-1.5 block">
          {label}
        </label>
      )}
      <input
        id={id}
        className={[
          'w-full bg-bg-muted border border-border-default rounded-md px-3 py-2',
          'text-text-primary placeholder-text-muted text-sm',
          'focus:outline-none focus:border-border-accent focus:ring-2 focus:ring-accent focus:bg-bg-elevated',
          'transition-all duration-150',
          error ? 'border-danger focus:border-danger focus:ring-danger' : '',
          className,
        ].join(' ')}
        {...rest}
      />
      {error && <p className="text-danger text-xs mt-1">{error}</p>}
      {hint && !error && <p className="text-text-muted text-xs mt-1">{hint}</p>}
    </div>
  )
}
