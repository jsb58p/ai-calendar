import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { getDb, saveSchedule } from '../services/db'
import { createCalendarEvent } from '../services/googleCalendar'

export const calendarRouter = Router()

// POST /api/calendar/sync
calendarRouter.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Record<string, unknown>
    const { taskId, access_token, refresh_token } = body

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

    const db = getDb()
    await db.read()

    const foundSchedule = db.data.schedules.find((s) =>
      s.tasks.some((t) => t.id === taskId)
    )

    if (!foundSchedule) {
      res.status(404).json({ error: 'Task not found' })
      return
    }

    const task = foundSchedule.tasks.find((t) => t.id === taskId)!

    const eventId = await createCalendarEvent(access_token, refresh_token, task)

    const updatedSchedule = {
      ...foundSchedule,
      tasks: foundSchedule.tasks.map((t) =>
        t.id === taskId ? { ...t, googleCalendarEventId: eventId } : t
      ),
    }
    await saveSchedule(updatedSchedule)

    res.status(200).json({ eventId })
  } catch (err) {
    next(err)
  }
})
