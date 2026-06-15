import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { v4 as uuid } from 'uuid'
import { getSchedule, saveSchedule, saveFeedback } from '../services/db'
import { adaptSchedule } from '../services/anthropic'
import { requireAuth } from '../middleware/auth'
import type { FeedbackEntry } from '../models/types'

export const feedbackRouter = Router()

feedbackRouter.use(requireAuth)

feedbackRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Record<string, unknown>
    const { scheduleId, rating, notes } = body
    const userId = req.user!.userId

    if (!scheduleId || typeof scheduleId !== 'string') {
      res.status(400).json({ error: 'scheduleId is required' })
      return
    }
    if (rating === undefined || typeof rating !== 'number') {
      res.status(400).json({ error: 'rating is required' })
      return
    }
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      res.status(400).json({ error: 'rating must be between 1 and 5' })
      return
    }
    if (!notes || typeof notes !== 'string') {
      res.status(400).json({ error: 'notes is required' })
      return
    }

    const schedule = await getSchedule(scheduleId, userId)
    if (schedule === undefined) {
      res.status(404).json({ error: 'Schedule not found' })
      return
    }

    const feedbackEntry: FeedbackEntry = {
      id: uuid(),
      scheduleId,
      rating: rating as FeedbackEntry['rating'],
      notes,
      createdAt: new Date().toISOString(),
    }

    const adapted = await adaptSchedule(schedule, feedbackEntry)
    await saveSchedule(adapted, userId)
    await saveFeedback(feedbackEntry, userId)

    res.status(200).json({ adapted, changesExplained: adapted.changesExplained })
  } catch (err) {
    next(err)
  }
})
