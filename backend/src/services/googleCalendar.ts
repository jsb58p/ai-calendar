import type { Task } from '../models/types'

// Stub — Google OAuth + googleapis will be wired in a future block
export async function createCalendarEvent(_task: Task): Promise<string> {
  throw new Error('Google Calendar integration not yet configured')
}
