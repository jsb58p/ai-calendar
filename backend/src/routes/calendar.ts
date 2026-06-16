import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { getDb, getSchedule, saveSchedule } from '../services/db'
import { createCalendarEvent } from '../services/googleCalendar'
import { requireAuth } from '../middleware/auth'
import type { Schedule } from '../models/types'

export const calendarRouter = Router()

calendarRouter.use(requireAuth)

// POST /api/calendar/sync
calendarRouter.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Record<string, unknown>
    const { taskId, access_token, refresh_token } = body
    const userId = req.user!.userId

    if (!taskId || typeof taskId !== 'string') {
      res.status(400).json({ error: 'taskId is required' })
      return
    }
    if (!access_token || typeof access_token !== 'string') {
      res.status(400).json({ error: 'access_token is required' })
      return
    }
    if (!refresh_token || typeof refresh_token !== 'string') {
      res.status(400).json({ error: 'refresh_token is required' })
      return
    }

    const doc = await getDb()
      .collection('schedules')
      .findOne({ 'tasks.id': taskId, userId }, { projection: { _id: 0, userId: 0 } })
    const foundSchedule = doc as Schedule | null

    if (!foundSchedule) {
      res.status(404).json({ error: 'Task not found' })
      return
    }

    const task = foundSchedule.tasks.find((t) => t.id === taskId)!

    const eventId = await createCalendarEvent(access_token, refresh_token, task)

    const updatedSchedule: Schedule = {
      ...foundSchedule,
      tasks: foundSchedule.tasks.map((t) =>
        t.id === taskId ? { ...t, googleCalendarEventId: eventId } : t
      ),
    }
    await saveSchedule(updatedSchedule, userId)

    res.status(200).json({ eventId })
  } catch (err) {
    next(err)
  }
})

// POST /api/calendar/sync-all
calendarRouter.post('/sync-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Record<string, unknown>
    const { goalId, access_token, refresh_token } = body
    const userId = req.user!.userId

    if (!goalId || typeof goalId !== 'string') {
      res.status(400).json({ error: 'goalId is required' })
      return
    }
    if (!access_token || typeof access_token !== 'string') {
      res.status(400).json({ error: 'access_token is required' })
      return
    }
    if (!refresh_token || typeof refresh_token !== 'string') {
      res.status(400).json({ error: 'refresh_token is required' })
      return
    }

    const foundSchedule = await getSchedule(goalId, userId)

    if (!foundSchedule) {
      res.status(404).json({ error: 'Schedule not found' })
      return
    }

    let synced = 0
    const updatedTasks = []

    for (const task of foundSchedule.tasks) {
      if (!task.googleCalendarEventId || task.googleCalendarEventId === '') {
        const eventId = await createCalendarEvent(access_token, refresh_token, task)
        updatedTasks.push({ ...task, googleCalendarEventId: eventId })
        synced++
      } else {
        updatedTasks.push(task)
      }
    }

    const updatedSchedule: Schedule = { ...foundSchedule, tasks: updatedTasks }
    await saveSchedule(updatedSchedule, userId)

    res.status(200).json({ synced })
  } catch (err) {
    next(err)
  }
})

// POST /api/calendar/connect-mobile
calendarRouter.post('/connect-mobile', (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>
  const { access_token, refresh_token = '' } = body

  if (!access_token || typeof access_token !== 'string') {
    res.status(400).json({ error: 'access_token is required' })
    return
  }

  res.status(200).json({
    access_token,
    refresh_token: typeof refresh_token === 'string' ? refresh_token : '',
  })
})
