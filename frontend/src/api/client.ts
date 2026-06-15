import axios from 'axios'
import type { GoalInput, Schedule, Task, UserSettings } from '../types'

export type CurrentUser = {
  id: string
  email: string
  displayName: string
  emailVerified: boolean
}

const baseURL = import.meta.env['VITE_API_URL']
  ? `${import.meta.env['VITE_API_URL']}/api`
  : '/api'

const api = axios.create({
  baseURL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
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
  settings: UserSettings
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

export async function updateTaskStatus(
  goalId: string,
  taskId: string,
  status: Task['status']
): Promise<Task> {
  try {
    const res = await api.patch<Task>(`/goals/${goalId}/tasks/${taskId}`, { status })
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to update task status'))
  }
}

export async function updateStepCompletion(
  goalId: string,
  taskId: string,
  completedSteps: number[]
): Promise<Task> {
  try {
    const res = await api.patch<Task>(`/goals/${goalId}/tasks/${taskId}/steps`, { completedSteps })
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to update step completion'))
  }
}

export async function register(data: {
  email: string
  password: string
  displayName: string
}): Promise<{ user: CurrentUser; message: string }> {
  try {
    const res = await api.post<{ user: CurrentUser; token?: string; message: string }>('/auth/users/register', data)
    if (res.data.token) localStorage.setItem('auth_token', res.data.token)
    return { user: res.data.user, message: res.data.message }
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to create account'))
  }
}

export async function login(data: {
  email: string
  password: string
}): Promise<{ user: CurrentUser }> {
  try {
    const res = await api.post<{ user: CurrentUser; token?: string }>('/auth/users/login', data)
    if (res.data.token) localStorage.setItem('auth_token', res.data.token)
    return { user: res.data.user }
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to sign in'))
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/users/logout')
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to sign out'))
  } finally {
    localStorage.removeItem('auth_token')
  }
}

export async function getMe(): Promise<{ user: CurrentUser }> {
  try {
    const res = await api.get<{ user: CurrentUser }>('/auth/users/me')
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Not authenticated'))
  }
}

export async function resendVerification(): Promise<void> {
  try {
    await api.post('/auth/users/resend-verification')
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to resend verification email'))
  }
}

export function getGoogleAuthUrl(): string {
  const base = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001'
  return `${base}/api/auth/google`
}

export function getGoogleSignInUrl(): string {
  const base = import.meta.env['VITE_API_URL']
  return base ? `${base}/api/auth/users/google` : '/api/auth/users/google'
}

export async function deleteGoal(goalId: string): Promise<void> {
  try {
    await api.delete(`/goals/${goalId}`)
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to delete goal'))
  }
}

export async function syncAllTasks(
  goalId: string,
  tokens: { access_token: string; refresh_token: string }
): Promise<{ synced: number }> {
  try {
    const res = await api.post<{ synced: number }>('/calendar/sync-all', { goalId, ...tokens })
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to sync tasks to calendar'))
  }
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
