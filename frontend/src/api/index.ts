import axios from 'axios'
import type { Goal, Feedback, CalendarEvent } from '../types'

const api = axios.create({
  baseURL: import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
})

export const goalsApi = {
  list: () => api.get<Goal[]>('/api/goals').then((r) => r.data),
  create: (payload: Pick<Goal, 'text' | 'timeframe' | 'priority'>) =>
    api.post<Goal>('/api/goals', payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/api/goals/${id}`),
}

export const feedbackApi = {
  submit: (payload: Feedback) =>
    api.post<Feedback>('/api/feedback', payload).then((r) => r.data),
}

export const calendarApi = {
  listEvents: (start: string, end: string) =>
    api
      .get<CalendarEvent[]>('/api/calendar/events', { params: { start, end } })
      .then((r) => r.data),
}
