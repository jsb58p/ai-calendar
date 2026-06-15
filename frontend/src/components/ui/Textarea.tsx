import type { TextareaHTMLAttributes } from 'react'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  id?: string
  error?: string
  hint?: string
  className?: string
}

export default function Textarea({ label, id, error, hint, className = '', ...rest }: Props) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="text-text-secondary text-sm font-medium mb-1.5 block">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={[
          'w-full bg-bg-muted border border-border-default rounded-md',
          'text-text-primary placeholder-text-muted text-sm',
          'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent focus:bg-bg-elevated focus:border-l-2 focus:border-l-accent',
          'transition-all duration-150 resize-none min-h-[100px]',
          error ? 'border-danger focus:border-danger focus:ring-danger' : '',
          className,
        ].join(' ')}
        style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px' }}
        {...rest}
      />
      {error && <p className="text-danger text-xs mt-1">{error}</p>}
      {hint && !error && <p className="text-text-muted text-xs mt-1">{hint}</p>}
    </div>
  )
}
