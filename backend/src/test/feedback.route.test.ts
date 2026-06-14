import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../services/db', () => ({
  initDb: vi.fn().mockResolvedValue(undefined),
  getDb: vi.fn(),
  saveGoal: vi.fn(),
  getGoal: vi.fn(),
  saveSchedule: vi.fn().mockResolvedValue(undefined),
  getSchedule: vi.fn(),
  saveFeedback: vi.fn().mockResolvedValue(undefined),
  getFeedbackForSchedule: vi.fn(),
  uuidv4: vi.fn(),
}))

vi.mock('../services/anthropic', () => ({
  generateSchedule: vi.fn(),
  adaptSchedule: vi.fn(),
}))

vi.mock('../services/googleCalendar', () => ({
  getOAuthClient: vi.fn(),
  getAuthUrl: vi.fn(),
  exchangeCode: vi.fn(),
  createCalendarEvent: vi.fn(),
  deleteCalendarEvent: vi.fn(),
  updateCalendarEvent: vi.fn().mockResolvedValue(undefined),
}))

import { feedbackRouter } from '../routes/feedback'
import { errorHandler } from '../middleware/errorHandler'
import { getSchedule, saveSchedule, saveFeedback } from '../services/db'
import { adaptSchedule } from '../services/anthropic'
import type { AdaptedSchedule, Schedule, Task } from '../models/types'

const MOCK_TASK: Task = {
  id: 'task-1',
  goalId: 'sched-1',
  title: 'Easy jog',
  description: 'Warm-up run to build the habit',
  scheduledDate: '2026-07-01',
  estimatedMinutes: 30,
  status: 'pending',
  stepInstructions: ['Lace up shoes', 'Stretch for 5 min', 'Jog at easy pace'],
}

const MOCK_SCHEDULE: Schedule = { goalId: 'sched-1', tasks: [MOCK_TASK] }

const MOCK_ADAPTED: AdaptedSchedule = {
  ...MOCK_SCHEDULE,
  changesExplained: 'Reduced intensity based on your feedback rating of 2.',
}

const app = express()
app.use(express.json())
app.use('/api/feedback', feedbackRouter)
app.use(errorHandler)

describe('POST /api/feedback', () => {
  beforeEach(() => {
    vi.mocked(getSchedule).mockResolvedValue(MOCK_SCHEDULE)
    vi.mocked(adaptSchedule).mockResolvedValue(MOCK_ADAPTED)
    vi.mocked(saveSchedule).mockResolvedValue(undefined)
    vi.mocked(saveFeedback).mockResolvedValue(undefined)
  })

  it('with valid body returns 200 and { adapted, changesExplained }', async () => {
    const res = await request(app).post('/api/feedback').send({
      scheduleId: 'sched-1',
      rating: 2,
      notes: 'Too intense, please reduce workout time',
    })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('adapted')
    expect(res.body).toHaveProperty('changesExplained')
    expect(res.body.changesExplained).toBe(MOCK_ADAPTED.changesExplained)
  })

  it('with rating 6 returns 400 with error mentioning 1 and 5', async () => {
    const res = await request(app).post('/api/feedback').send({
      scheduleId: 'sched-1',
      rating: 6,
      notes: 'Too intense',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/1 and 5/i)
  })

  it('with rating 0 returns 400', async () => {
    const res = await request(app).post('/api/feedback').send({
      scheduleId: 'sched-1',
      rating: 0,
      notes: 'Too intense',
    })
    expect(res.status).toBe(400)
  })

  it('with unknown scheduleId returns 404', async () => {
    vi.mocked(getSchedule).mockResolvedValue(undefined)
    const res = await request(app).post('/api/feedback').send({
      scheduleId: 'nonexistent',
      rating: 3,
      notes: 'Decent pace',
    })
    expect(res.status).toBe(404)
  })

  it('if adaptSchedule throws returns 500', async () => {
    vi.mocked(adaptSchedule).mockRejectedValue(new Error('Anthropic API down'))
    const res = await request(app).post('/api/feedback').send({
      scheduleId: 'sched-1',
      rating: 2,
      notes: 'Too intense',
    })
    expect(res.status).toBe(500)
  })
})
