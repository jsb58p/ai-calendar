import { Router } from 'express'
import type { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import { readDb, writeDb } from '../services/db'
import type { GoalInput } from '../models/types'

export const goalsRouter = Router()

goalsRouter.get('/', (_req: Request, res: Response) => {
  const db = readDb()
  res.json(db.goals)
})

goalsRouter.post('/', (req: Request, res: Response) => {
  const body = req.body as Partial<GoalInput>
  const { title, description, targetDate } = body
  if (!title || !description || !targetDate) {
    res.status(400).json({ error: 'title, description, and targetDate are required' })
    return
  }
  const db = readDb()
  const goal: GoalInput = {
    id: uuid(),
    title,
    description,
    targetDate,
    createdAt: new Date().toISOString(),
  }
  db.goals.push(goal)
  writeDb(db)
  res.status(201).json(goal)
})

goalsRouter.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params
  const db = readDb()
  const index = db.goals.findIndex((g: GoalInput) => g.id === id)
  if (index === -1) {
    res.status(404).json({ error: 'Goal not found' })
    return
  }
  db.goals.splice(index, 1)
  writeDb(db)
  res.status(204).send()
})
