import axios from 'axios'
import type { GoalInput, Schedule } from '../types'

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true,
})

function extractMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const serverMsg = (err.response?.data as { error?: string } | undefined)?.error
    return serverMsg ?? fallback
  }
  return fallback
}

export async function submitGoal(data: {
  title: string
  description: string
  targetDate: string
}): Promise<{ goal: GoalInput; schedule: Schedule }> {
  try {
    const res = await api.post<{ goal: GoalInput; schedule: Schedule }>('/goals', data)
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to create goal'))
  }
}

export async function fetchSchedule(goalId: string): Promise<Schedule> {
  try {
    const res = await api.get<Schedule>(`/goals/${goalId}/schedule`)
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to fetch schedule'))
  }
}

export async function fetchGoals(): Promise<{ goals: GoalInput[] }> {
  try {
    const res = await api.get<{ goals: GoalInput[] }>('/goals')
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to fetch goals'))
  }
}

export async function submitFeedback(data: {
  scheduleId: string
  rating: number
  notes: string
}): Promise<{ adapted: Schedule; changesExplained: string }> {
  try {
    const res = await api.post<{ adapted: Schedule; changesExplained: string }>('/feedback', data)
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to submit feedback'))
  }
}

export function getGoogleAuthUrl(): string {
  return 'http://localhost:3001/api/auth/google'
}

export async function syncTaskToCalendar(
  taskId: string,
  tokens: { access_token: string; refresh_token: string }
): Promise<{ eventId: string }> {
  try {
    const res = await api.post<{ eventId: string }>('/calendar/sync', { taskId, ...tokens })
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to sync task to calendar'))
  }
}
