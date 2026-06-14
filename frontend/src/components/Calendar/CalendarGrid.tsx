import { useState } from 'react'
import type { Schedule } from '../../types'
import { useAppStore } from '../../store/useAppStore'
import {
  getDaysInMonth,
  getStartDayOfWeek,
  formatDisplayDate,
  getTasksForDate,
  isSameDayUtil,
  getTodayString,
} from '../../utils/calendar'
import { format, parseISO } from 'date-fns'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  schedule: Schedule
}

export function CalendarGrid({ schedule }: Props) {
  const now = new Date()
  const [displayYear, setDisplayYear] = useState(now.getFullYear())
  const [displayMonth, setDisplayMonth] = useState(now.getMonth())

  const selectedDate = useAppStore((s) => s.selectedDate)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId)

  const today = parseISO(getTodayString())
  const days = getDaysInMonth(displayYear, displayMonth)
  const startOffset = getStartDayOfWeek(days[0]!)

  function prevMonth() {
    if (displayMonth === 0) {
      setDisplayMonth(11)
      setDisplayYear((y) => y - 1)
    } else {
      setDisplayMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (displayMonth === 11) {
      setDisplayMonth(0)
      setDisplayYear((y) => y + 1)
    } else {
      setDisplayMonth((m) => m + 1)
    }
  }

  function goToToday() {
    const n = new Date()
    setDisplayYear(n.getFullYear())
    setDisplayMonth(n.getMonth())
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <button
          data-testid="prev-month-button"
          aria-label="Previous month"
          onClick={prevMonth}
        >
          &lt;
        </button>

        <span data-testid="month-display" style={{ fontWeight: 600, minWidth: '140px', textAlign: 'center' }}>
          {formatDisplayDate(new Date(displayYear, displayMonth, 1))}
        </span>

        <button
          data-testid="next-month-button"
          aria-label="Next month"
          onClick={nextMonth}
        >
          &gt;
        </button>

        <button data-testid="today-button" onClick={goToToday} style={{ marginLeft: '8px' }}>
          Today
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            data-testid="day-header"
            style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, padding: '4px 0' }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {/* Leading empty cells */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const isToday = isSameDayUtil(day, today)
          const isSelected = isSameDayUtil(day, selectedDate)
          const tasks = getTasksForDate(schedule.tasks, day)
          const visibleTasks = tasks.slice(0, 3)
          const extraCount = tasks.length - visibleTasks.length

          return (
            <div
              key={dateKey}
              data-testid={`day-cell-${dateKey}`}
              data-today={isToday || undefined}
              onClick={() => {
                setSelectedDate(day)
                setSelectedTaskId(null)
              }}
              style={{
                minHeight: '80px',
                padding: '4px',
                cursor: 'pointer',
                borderRadius: '4px',
                border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                backgroundColor: isToday ? '#eff6ff' : '#fff',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: isToday ? 700 : 400, marginBottom: '2px' }}>
                {day.getDate()}
              </div>

              {visibleTasks.map((task) => (
                <div
                  key={task.id}
                  data-testid="task-chip"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedTaskId(task.id)
                  }}
                  style={{
                    fontSize: '11px',
                    padding: '2px 4px',
                    marginBottom: '2px',
                    backgroundColor: '#dbeafe',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {task.title}
                </div>
              ))}

              {extraCount > 0 && (
                <div
                  data-testid="more-tasks-indicator"
                  style={{ fontSize: '11px', color: '#6b7280' }}
                >
                  +{extraCount} more
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
