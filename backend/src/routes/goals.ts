import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { v4 as uuid } from 'uuid'
import {
  saveGoal,
  saveSchedule,
  getSchedule,
  saveSettings,
  getAllGoals,
  getGoal,
  getDb,
} from '../services/db'
import { generateSchedule } from '../services/anthropic'
import { requireAuth } from '../middleware/auth'
import type { GoalInput, Task, Schedule, UserSettings } from '../models/types'
import { DEFAULT_SETTINGS } from '../models/types'

export const goalsRouter = Router()

goalsRouter.use(requireAuth)

// GET /api/goals
goalsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const goals = await getAllGoals(req.user!.userId)
    res.json({ goals })
  } catch (err) {
    next(err)
  }
})

// GET /api/goals/:id/schedule
goalsRouter.get('/:id/schedule', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const schedule = await getSchedule(req.params.id, req.user!.userId)
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
      const userId = req.user!.userId
      const { status } = req.body as Record<string, unknown>

      const validStatuses = ['pending', 'complete', 'skipped'] as const
      if (!status || !validStatuses.includes(status as Task['status'])) {
        res.status(400).json({ error: 'status must be one of: pending, complete, skipped' })
        return
      }

      const schedule = await getSchedule(goalId, userId)
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
      const updatedSchedule: Schedule = {
        ...schedule,
        tasks: schedule.tasks.map((t, i) => (i === taskIndex ? updatedTask : t)),
      }

      await saveSchedule(updatedSchedule, userId)
      res.status(200).json(updatedTask)
    } catch (err) {
      next(err)
    }
  }
)

// PATCH /api/goals/:goalId/tasks/:taskId/steps
goalsRouter.patch(
  '/:goalId/tasks/:taskId/steps',
  async (req: Request<{ goalId: string; taskId: string }>, res: Response, next: NextFunction) => {
    try {
      const { goalId, taskId } = req.params
      const userId = req.user!.userId
      const { completedSteps } = req.body as Record<string, unknown>

      if (
        !Array.isArray(completedSteps) ||
        !completedSteps.every((s) => typeof s === 'number')
      ) {
        res.status(400).json({ error: 'completedSteps must be an array of numbers' })
        return
      }

      const schedule = await getSchedule(goalId, userId)
      if (schedule === undefined) {
        res.status(404).json({ error: 'Schedule not found' })
        return
      }

      const taskIndex = schedule.tasks.findIndex((t) => t.id === taskId)
      if (taskIndex === -1) {
        res.status(404).json({ error: 'Task not found' })
        return
      }

      const updatedTask: Task = { ...schedule.tasks[taskIndex]!, completedSteps }
      const updatedSchedule: Schedule = {
        ...schedule,
        tasks: schedule.tasks.map((t, i) => (i === taskIndex ? updatedTask : t)),
      }

      await saveSchedule(updatedSchedule, userId)
      res.status(200).json(updatedTask)
    } catch (err) {
      next(err)
    }
  }
)

function isValidSettings(s: unknown): s is UserSettings {
  if (typeof s !== 'object' || s === null) return false
  const o = s as Record<string, unknown>
  return (
    Array.isArray(o.availableDays) &&
    typeof o.dailyStartTime === 'string' &&
    typeof o.dailyEndTime === 'string' &&
    typeof o.minTaskDuration === 'number' &&
    typeof o.maxTaskDuration === 'number' &&
    ['flat', 'easy-to-hard', 'hard-to-easy'].includes(o.difficultyRamp as string) &&
    typeof o.weeklyReviewDay === 'number' &&
    Array.isArray(o.blackoutDates) &&
    typeof o.timezone === 'string'
  )
}

// DELETE /api/goals/:id
goalsRouter.delete('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.userId

    const goal = await getGoal(id, userId)
    if (!goal) {
      res.status(404).json({ error: 'Goal not found' })
      return
    }

    const db = getDb()
    await db.collection('goals').deleteOne({ id, userId })
    await db.collection('schedules').deleteOne({ goalId: id, userId })
    await db.collection('feedback').deleteMany({ scheduleId: id, userId })
    await db.collection('settings').deleteOne({ goalId: id, userId })

    res.status(200).json({ message: 'Goal deleted' })
  } catch (err) {
    next(err)
  }
})

// POST /api/goals
goalsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Record<string, unknown>
    const { title, description, targetDate, settings: rawSettings } = body
    const userId = req.user!.userId

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

    let settings: UserSettings | undefined
    if (rawSettings !== undefined) {
      if (!isValidSettings(rawSettings)) {
        res.status(400).json({ error: 'settings has an invalid shape — all required fields must be present' })
        return
      }
      settings = rawSettings
    }

    const goal: GoalInput = {
      id: uuid(),
      userId,
      title,
      description,
      targetDate,
      createdAt: new Date().toISOString(),
    }

    await saveGoal(goal, userId)
    await saveSettings(goal.id, settings ?? DEFAULT_SETTINGS, userId)

    let schedule: Schedule
    try {
      schedule = await generateSchedule(goal, settings ?? DEFAULT_SETTINGS)
    } catch (err) {
      next(err)
      return
    }

    await saveSchedule(schedule, userId)

    res.status(201).json({ goal, schedule })
  } catch (err) {
    next(err)
  }
})
