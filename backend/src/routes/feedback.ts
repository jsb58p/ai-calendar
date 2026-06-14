import { Router } from 'express'
import type { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import { saveFeedback } from '../services/db'
import type { FeedbackEntry } from '../models/types'

export const feedbackRouter = Router()

feedbackRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body as Partial<FeedbackEntry>
  const { scheduleId, rating, notes } = body
  if (!scheduleId || rating === undefined || !notes) {
    res.status(400).json({ error: 'scheduleId, rating, and notes are required' })
    return
  }
  const entry: FeedbackEntry = {
    id: uuid(),
    scheduleId,
    rating: rating as FeedbackEntry['rating'],
    notes,
    createdAt: new Date().toISOString(),
  }
  await saveFeedback(entry)
  res.status(201).json(entry)
})
