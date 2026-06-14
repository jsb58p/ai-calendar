/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
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
        'accent-muted':   '#6366f120',
        'border-default': '#2a2a3a',
        'border-accent':  '#6366f1',
        'success':  '#22c55e',
        'warning':  '#f59e0b',
        'danger':   '#ef4444',
        'info':     '#38bdf8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'surface': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        'elevated': '0 4px 16px rgba(0,0,0,0.6)',
        'accent': '0 0 0 2px #6366f1',
      },
    },
  },
  plugins: [],
}
