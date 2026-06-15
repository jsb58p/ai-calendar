import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

vi.mock('../services/db', () => ({
  initDb: vi.fn().mockResolvedValue(undefined),
  getDb: vi.fn().mockReturnValue({
    read: vi.fn().mockResolvedValue(undefined),
    data: { goals: [] },
  }),
  saveGoal: vi.fn().mockResolvedValue(undefined),
  getGoal: vi.fn(),
  saveSchedule: vi.fn().mockResolvedValue(undefined),
  getSchedule: vi.fn(),
  saveFeedback: vi.fn().mockResolvedValue(undefined),
  getFeedbackForSchedule: vi.fn(),
  saveSettings: vi.fn().mockResolvedValue(undefined),
  getSettings: vi.fn(),
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
  createCalendarEvent: vi.fn().mockResolvedValue('evt-1'),
  deleteCalendarEvent: vi.fn().mockResolvedValue(undefined),
  updateCalendarEvent: vi.fn().mockResolvedValue(undefined),
}))

import { goalsRouter } from '../routes/goals'
import { errorHandler } from '../middleware/errorHandler'
import { saveGoal, saveSchedule, getSchedule } from '../services/db'
import { generateSchedule } from '../services/anthropic'
import type { Schedule, Task } from '../models/types'

const MOCK_TASK: Task = {
  id: 'task-1',
  goalId: 'goal-1',
  title: 'Easy jog',
  description: 'Warm-up run to build the habit',
  scheduledDate: '2026-07-01',
  estimatedMinutes: 30,
  status: 'pending',
  stepInstructions: ['Lace up shoes', 'Stretch for 5 min', 'Jog at easy pace'],
}

const MOCK_SCHEDULE: Schedule = { goalId: 'goal-1', tasks: [MOCK_TASK] }

const app = express()
app.use(express.json())
app.use('/api/goals', goalsRouter)
app.use(errorHandler)

describe('POST /api/goals', () => {
  beforeEach(() => {
    vi.mocked(saveGoal).mockResolvedValue(undefined)
    vi.mocked(generateSchedule).mockResolvedValue(MOCK_SCHEDULE)
    vi.mocked(saveSchedule).mockResolvedValue(undefined)
  })

  it('with valid body returns 201 and { goal, schedule }', async () => {
    const res = await request(app).post('/api/goals').send({
      title: 'Run a 5K',
      description: 'Train consistently to complete a 5K race',
      targetDate: '2026-09-01',
    })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('goal')
    expect(res.body).toHaveProperty('schedule')
    expect(res.body.goal.title).toBe('Run a 5K')
    expect(res.body.schedule).toEqual(MOCK_SCHEDULE)
  })

  it('missing title returns 400 with error mentioning title', async () => {
    const res = await request(app).post('/api/goals').send({
      description: 'Train consistently',
      targetDate: '2026-09-01',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/title/i)
  })

  it('missing description returns 400', async () => {
    const res = await request(app).post('/api/goals').send({
      title: 'Run a 5K',
      targetDate: '2026-09-01',
    })
    expect(res.status).toBe(400)
  })

  it('with past targetDate returns 400 with error mentioning future', async () => {
    const res = await request(app).post('/api/goals').send({
      title: 'Run a 5K',
      description: 'Train consistently',
      targetDate: '2020-01-01',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/future/i)
  })
})

describe('GET /api/goals/:id/schedule', () => {
  it('with unknown id returns 404', async () => {
    vi.mocked(getSchedule).mockResolvedValue(undefined)
    const res = await request(app).get('/api/goals/unknown-id/schedule')
    expect(res.status).toBe(404)
  })

  it('with known id returns 200 and the schedule object', async () => {
    vi.mocked(getSchedule).mockResolvedValue(MOCK_SCHEDULE)
    const res = await request(app).get('/api/goals/goal-1/schedule')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(MOCK_SCHEDULE)
  })
})

describe('PATCH /api/goals/:goalId/tasks/:taskId/steps', () => {
  it('with valid completedSteps array returns 200 and updated task', async () => {
    vi.mocked(getSchedule).mockResolvedValue(MOCK_SCHEDULE)
    vi.mocked(saveSchedule).mockResolvedValue(undefined)

    const res = await request(app)
      .patch('/api/goals/goal-1/tasks/task-1/steps')
      .send({ completedSteps: [0, 2] })

    expect(res.status).toBe(200)
    expect(res.body.id).toBe('task-1')
    expect(res.body.completedSteps).toEqual([0, 2])
  })

  it('with unknown goalId returns 404', async () => {
    vi.mocked(getSchedule).mockResolvedValue(undefined)

    const res = await request(app)
      .patch('/api/goals/no-such-goal/tasks/task-1/steps')
      .send({ completedSteps: [1] })

    expect(res.status).toBe(404)
  })
})
