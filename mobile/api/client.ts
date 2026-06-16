import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import type { GoalInput, Schedule, Task, UserSettings, CurrentUser, AdminUser } from '../types'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3001'

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
})

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token')
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

export async function register(data: {
  email: string
  password: string
  displayName: string
}): Promise<{ user: CurrentUser; message: string }> {
  try {
    const res = await apiClient.post<{ user: CurrentUser; token?: string; message: string }>('/auth/users/register', data)
    if (res.data.token) await SecureStore.setItemAsync('auth_token', res.data.token)
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
    const res = await apiClient.post<{ user: CurrentUser; token?: string }>('/auth/users/login', data)
    if (res.data.token) await SecureStore.setItemAsync('auth_token', res.data.token)
    return { user: res.data.user }
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to sign in'))
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/users/logout')
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to sign out'))
  } finally {
    await SecureStore.deleteItemAsync('auth_token')
  }
}

export async function getMe(): Promise<{ user: CurrentUser }> {
  try {
    const res = await apiClient.get<{ user: CurrentUser }>('/auth/users/me')
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Not authenticated'))
  }
}

export async function resendVerification(): Promise<void> {
  try {
    await apiClient.post('/auth/users/resend-verification')
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to resend verification email'))
  }
}

export async function submitGoal(data: {
  title: string
  description: string
  targetDate: string
  settings: UserSettings
}): Promise<{ goal: GoalInput; schedule: Schedule }> {
  try {
    const res = await apiClient.post<{ goal: GoalInput; schedule: Schedule }>('/goals', data)
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to create goal'))
  }
}

export async function fetchSchedule(goalId: string): Promise<Schedule> {
  try {
    const res = await apiClient.get<Schedule>(`/goals/${goalId}/schedule`)
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to fetch schedule'))
  }
}

export async function fetchGoals(): Promise<{ goals: GoalInput[] }> {
  try {
    const res = await apiClient.get<{ goals: GoalInput[] }>('/goals')
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to fetch goals'))
  }
}

export async function deleteGoal(goalId: string): Promise<void> {
  try {
    await apiClient.delete(`/goals/${goalId}`)
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to delete goal'))
  }
}

export async function submitFeedback(data: {
  scheduleId: string
  rating: number
  notes: string
}): Promise<{ adapted: Schedule; changesExplained: string }> {
  try {
    const res = await apiClient.post<{ adapted: Schedule; changesExplained: string }>('/feedback', data)
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to submit feedback'))
  }
}

export async function syncAllTasks(
  goalId: string,
  tokens: { access_token: string; refresh_token: string }
): Promise<{ synced: number }> {
  try {
    const res = await apiClient.post<{ synced: number }>('/calendar/sync-all', { goalId, ...tokens })
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to sync tasks to calendar'))
  }
}

export async function updateTaskStatus(
  goalId: string,
  taskId: string,
  status: Task['status']
): Promise<Task> {
  try {
    const res = await apiClient.patch<Task>(`/goals/${goalId}/tasks/${taskId}`, { status })
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
    const res = await apiClient.patch<Task>(`/goals/${goalId}/tasks/${taskId}/steps`, { completedSteps })
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to update step completion'))
  }
}

export async function fetchAdminUsers(): Promise<{ users: AdminUser[] }> {
  try {
    const res = await apiClient.get<{ users: AdminUser[] }>('/admin/users')
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to fetch users'))
  }
}

export async function deleteUser(userId: string): Promise<void> {
  try {
    await apiClient.delete(`/admin/users/${userId}`)
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to delete user'))
  }
}

export async function suspendUser(userId: string): Promise<{ user: AdminUser }> {
  try {
    const res = await apiClient.patch<{ user: AdminUser }>(`/admin/users/${userId}/suspend`)
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to suspend user'))
  }
}

export async function resetUserPassword(userId: string): Promise<void> {
  try {
    await apiClient.patch(`/admin/users/${userId}/reset-password`)
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to reset password'))
  }
}

export async function toggleUserAdmin(userId: string): Promise<{ user: AdminUser }> {
  try {
    const res = await apiClient.patch<{ user: AdminUser }>(`/admin/users/${userId}/toggle-admin`)
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to toggle admin status'))
  }
}

export async function connectGoogleCalendarMobile(
  accessToken: string,
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string }> {
  try {
    const res = await apiClient.post<{ access_token: string; refresh_token: string }>(
      '/calendar/connect-mobile',
      { access_token: accessToken, refresh_token: refreshToken }
    )
    return res.data
  } catch (err) {
    throw new Error(extractMessage(err, 'Failed to connect Google Calendar'))
  }
}
