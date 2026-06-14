import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns'

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), 'h:mm a')
}

export function formatDateTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 0 }),
    end: endOfWeek(date, { weekStartsOn: 0 }),
  }
}

export function getDayRange(date: Date): { start: Date; end: Date } {
  return { start: startOfDay(date), end: endOfDay(date) }
}

export function getWeekDays(date: Date): Date[] {
  const { start, end } = getWeekRange(date)
  return eachDayOfInterval({ start, end })
}

export function cn(...classes: Array<string | boolean | undefined | null>): string {
  return classes.filter(Boolean).join(' ')
}
