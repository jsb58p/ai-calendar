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
import { TaskCard } from '../TaskCard/TaskCard'
import { Button } from '../ui'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  schedule: Schedule
}

export function CalendarGrid({ schedule }: Props) {
  const now = new Date()
  const [displayYear, setDisplayYear] = useState(now.getFullYear())
  const [displayMonth, setDisplayMonth] = useState(now.getMonth())
  const [isTransitioning, setIsTransitioning] = useState(false)

  const selectedDate = useAppStore((s) => s.selectedDate)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const setSelectedTaskId = useAppStore((s) => s.setSelectedTaskId)

  const today = parseISO(getTodayString())
  const days = getDaysInMonth(displayYear, displayMonth)
  const startOffset = getStartDayOfWeek(days[0]!)

  function prevMonth() {
    setIsTransitioning(true)
    if (displayMonth === 0) {
      setDisplayMonth(11)
      setDisplayYear((y) => y - 1)
    } else {
      setDisplayMonth((m) => m - 1)
    }
    setTimeout(() => setIsTransitioning(false), 150)
  }

  function nextMonth() {
    setIsTransitioning(true)
    if (displayMonth === 11) {
      setDisplayMonth(0)
      setDisplayYear((y) => y + 1)
    } else {
      setDisplayMonth((m) => m + 1)
    }
    setTimeout(() => setIsTransitioning(false), 150)
  }

  function goToToday() {
    setIsTransitioning(true)
    const n = new Date()
    setDisplayYear(n.getFullYear())
    setDisplayMonth(n.getMonth())
    setTimeout(() => setIsTransitioning(false), 150)
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-base overflow-hidden">
      {/* Navigation row */}
      <div className="flex items-center gap-3 px-6 py-3 bg-bg-surface border-b border-border-default">
        <Button
          data-testid="prev-month-button"
          aria-label="Previous month"
          variant="ghost"
          size="sm"
          onClick={prevMonth}
          className="font-mono text-lg"
        >
          ‹
        </Button>

        <span
          data-testid="month-display"
          className="font-mono font-medium text-text-primary text-sm min-w-[140px] text-center"
        >
          {formatDisplayDate(new Date(displayYear, displayMonth, 1))}
        </span>

        <Button
          data-testid="next-month-button"
          aria-label="Next month"
          variant="ghost"
          size="sm"
          onClick={nextMonth}
          className="font-mono text-lg"
        >
          ›
        </Button>

        <Button
          data-testid="today-button"
          variant="secondary"
          size="sm"
          onClick={goToToday}
        >
          Today
        </Button>
      </div>

      {/* Day-of-week header row */}
      <div className="grid grid-cols-7 bg-bg-surface border-b border-border-default">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            data-testid="day-header"
            className="py-2 text-center text-text-muted text-xs font-mono font-medium uppercase tracking-wider"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={[
        'flex-1 grid grid-cols-7 grid-rows-5 bg-border-default gap-px overflow-auto',
        'transition-opacity duration-150',
        isTransitioning ? 'opacity-0' : 'opacity-100',
      ].join(' ')}>
        {/* Leading empty cells */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-bg-surface" />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const isToday = isSameDayUtil(day, today)
          const isSelected = isSameDayUtil(day, selectedDate)
          const tasks = getTasksForDate(schedule.tasks, day)
          const visibleTasks = tasks.slice(0, 2)
          const extraCount = tasks.length - visibleTasks.length

          return (
            <div
              key={dateKey}
              data-testid={`day-cell-${dateKey}`}
              data-today={isToday ? 'true' : undefined}
              onClick={() => {
                setSelectedDate(day)
                setSelectedTaskId(null)
              }}
              className={[
                'flex flex-col p-2 min-h-[100px] overflow-visible cursor-pointer transition-all duration-100',
                isSelected ? 'bg-accent/15 ring-2 ring-accent' : 'bg-bg-surface hover:bg-accent/10 hover:ring-2 hover:ring-accent/50 active:bg-accent/20',
                isToday ? 'ring-2 ring-inset ring-accent' : '',
              ].join(' ')}
            >
              <div
                className={[
                  'font-mono text-xs font-medium mb-1',
                  isToday ? 'text-accent font-bold' : 'text-text-secondary',
                ].join(' ')}
              >
                {day.getDate()}
              </div>

              <div className="overflow-hidden">
                {visibleTasks.map((task) => (
                  <div
                    key={task.id}
                    title={task.description ? task.description.slice(0, 100) : task.title}
                    onClick={(e) => e.stopPropagation()}
                    className="mb-1"
                  >
                    <TaskCard task={task} onClick={(t) => setSelectedTaskId(t.id)} />
                  </div>
                ))}
              </div>

              {extraCount > 0 && (
                <div
                  data-testid="more-tasks-indicator"
                  className="text-text-muted text-xs font-mono mt-auto"
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
