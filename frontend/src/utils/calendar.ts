import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format, isSameDay, parseISO } from 'date-fns'
import type { Task } from '../types'

export function getDaysInMonth(year: number, month: number): Date[] {
  const first = startOfMonth(new Date(year, month, 1))
  const last = endOfMonth(first)
  return eachDayOfInterval({ start: first, end: last })
}

export function getStartDayOfWeek(date: Date): number {
  return getDay(startOfMonth(date))
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'MMMM yyyy')
}

export function formatShortDate(date: Date): string {
  return format(date, 'EEE, MMM d')
}

export function isSameDayUtil(a: Date, b: Date): boolean {
  return isSameDay(a, b)
}

export function getTasksForDate(tasks: Task[], date: Date): Task[] {
  return tasks.filter((task) => isSameDay(parseISO(task.scheduledDate), date))
}

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
