module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'bg-base':     '#0a0a0f',
        'bg-surface':  '#111118',
        'bg-elevated': '#1a1a24',
        'bg-muted':    '#22222e',
        'text-primary':   '#f0f0ff',
        'text-secondary': '#9090aa',
        'text-muted':     '#5a5a72',
        'accent':         '#6366f1',
        'accent-hover':   '#4f52d4',
        'success':  '#22c55e',
        'warning':  '#f59e0b',
        'danger':   '#ef4444',
        'info':     '#38bdf8',
        'border-default': '#2a2a3a',
        'border-accent':  '#6366f1',
      }
    }
  },
  plugins: []
}
