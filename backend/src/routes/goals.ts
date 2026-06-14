import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { v4 as uuid } from 'uuid'
import {
  saveGoal,
  getGoal,
  saveSchedule,
  getSchedule,
  saveFeedback,
  getFeedbackForSchedule,
  getDb,
} from '../services/db'
import { generateSchedule } from '../services/anthropic'
import { createCalendarEvent } from '../services/googleCalendar'
import type { GoalInput, Task, Schedule, FeedbackEntry, AdaptedSchedule, DBSchema } from '../models/types'

export const goalsRouter = Router()

// GET /api/goals
goalsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb()
    await db.read()
    res.json({ goals: db.data.goals })
  } catch (err) {
    next(err)
  }
})

// GET /api/goals/:id/schedule
goalsRouter.get('/:id/schedule', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const schedule = await getSchedule(id)
    if (schedule === undefined) {
      res.status(404).json({ error: 'Schedule not found' })
      return
    }
    res.json(schedule)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/goals/:goalId/tasks/:taskId
goalsRouter.patch(
  '/:goalId/tasks/:taskId',
  async (req: Request<{ goalId: string; taskId: string }>, res: Response, next: NextFunction) => {
    try {
      const { goalId, taskId } = req.params
      const { status } = req.body as Record<string, unknown>

      const validStatuses = ['pending', 'complete', 'skipped'] as const
      if (!status || !validStatuses.includes(status as Task['status'])) {
        res.status(400).json({ error: 'status must be one of: pending, complete, skipped' })
        return
      }

      const schedule = await getSchedule(goalId)
      if (schedule === undefined) {
        res.status(404).json({ error: 'Schedule not found' })
        return
      }

      const taskIndex = schedule.tasks.findIndex((t) => t.id === taskId)
      if (taskIndex === -1) {
        res.status(404).json({ error: 'Task not found' })
        return
      }

      const updatedTask: Task = { ...schedule.tasks[taskIndex]!, status: status as Task['status'] }
      const updatedSchedule = {
        ...schedule,
        tasks: schedule.tasks.map((t, i) => (i === taskIndex ? updatedTask : t)),
      }

      await saveSchedule(updatedSchedule)
      res.status(200).json(updatedTask)
    } catch (err) {
      next(err)
    }
  }
)

// POST /api/goals
goalsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Record<string, unknown>
    const { title, description, targetDate } = body

    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'title is required' })
      return
    }
    if (!description || typeof description !== 'string') {
      res.status(400).json({ error: 'description is required' })
      return
    }
    if (!targetDate || typeof targetDate !== 'string') {
      res.status(400).json({ error: 'targetDate is required' })
      return
    }

    const target = new Date(targetDate)
    if (isNaN(target.getTime()) || target <= new Date()) {
      res.status(400).json({ error: 'targetDate must be a future date' })
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

    let schedule: Schedule
    try {
      schedule = await generateSchedule(goal)
    } catch (err) {
      next(err)
      return
    }

    await saveSchedule(schedule)

    res.status(201).json({ goal, schedule })
  } catch (err) {
    next(err)
  }
})
