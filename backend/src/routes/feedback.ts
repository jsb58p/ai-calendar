import { Router } from 'express'
import type { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import { readDb, writeDb } from '../services/db'
import type { FeedbackEntry } from '../models/types'

export const feedbackRouter = Router()

feedbackRouter.post('/', (req: Request, res: Response) => {
  const body = req.body as Partial<FeedbackEntry>
  const { scheduleId, rating, notes } = body
  if (!scheduleId || rating === undefined || !notes) {
    res.status(400).json({ error: 'scheduleId, rating, and notes are required' })
    return
  }
  const db = readDb()
  const entry: FeedbackEntry = {
    id: uuid(),
    scheduleId,
    rating: rating as FeedbackEntry['rating'],
    notes,
    createdAt: new Date().toISOString(),
  }
  db.feedback.push(entry)
  writeDb(db)
  res.status(201).json(entry)
})
