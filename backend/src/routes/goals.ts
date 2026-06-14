import { Router } from 'express'
import type { Request, Response } from 'express'
import { v4 as uuid } from 'uuid'
import { saveGoal, getDb } from '../services/db'
import type { GoalInput } from '../models/types'

export const goalsRouter = Router()

goalsRouter.get('/', async (_req: Request, res: Response) => {
  const db = getDb()
  await db.read()
  res.json(db.data.goals)
})

goalsRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body as Partial<GoalInput>
  const { title, description, targetDate } = body
  if (!title || !description || !targetDate) {
    res.status(400).json({ error: 'title, description, and targetDate are required' })
    return
  }
  const goal: GoalInput = {
    id: uuid(),
    title,
    description,
    targetDate,
    createdAt: new Date().toISOString(),
  }
  await saveGoal(goal)
  res.status(201).json(goal)
})

goalsRouter.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params
  const db = getDb()
  await db.read()
  const index = db.data.goals.findIndex((g: GoalInput) => g.id === id)
  if (index === -1) {
    res.status(404).json({ error: 'Goal not found' })
    return
  }
  db.data.goals.splice(index, 1)
  await db.write()
  res.status(204).send()
})
