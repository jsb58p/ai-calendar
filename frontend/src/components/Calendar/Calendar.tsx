import { getWeekDays, cn } from '../../utils'
import { useCalendarStore } from '../../store'
import type { CalendarEvent } from '../../types'

interface CalendarProps {
  events?: CalendarEvent[]
}

export function Calendar({ events = [] }: CalendarProps) {
  const { selectedDate, setSelectedDate } = useCalendarStore()
  const days = getWeekDays(selectedDate)

  return (
    <div className="flex flex-col h-full">
      <header className="grid grid-cols-7 border-b border-gray-200 bg-white">
        {days.map((day) => {
          const isSelected = day.toDateString() === selectedDate.toDateString()
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={cn(
                'py-3 text-center text-sm font-medium transition-colors hover:bg-gray-50',
                isSelected && 'bg-blue-50 text-blue-600'
              )}
            >
              <div className="text-xs text-gray-400 uppercase">
                {day.toLocaleDateString('en', { weekday: 'short' })}
              </div>
              <div className="mt-0.5 text-base">{day.getDate()}</div>
            </button>
          )
        })}
      </header>
      <div className="flex-1 overflow-auto p-6">
        {events.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-16">
            No events this week — add a goal to get AI-powered scheduling.
          </p>
        )}
      </div>
    </div>
  )
}
