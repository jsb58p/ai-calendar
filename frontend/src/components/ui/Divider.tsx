interface Props {
  label?: string
  className?: string
}

export default function Divider({ label, className = '' }: Props) {
  if (!label) {
    return <hr className={`border-border-default ${className}`} />
  }

  return (
    <div className={`flex items-center ${className}`}>
      <hr className="flex-1 border-border-default" />
      <span className="text-text-muted text-xs font-mono px-3">{label}</span>
      <hr className="flex-1 border-border-default" />
    </div>
  )
}
