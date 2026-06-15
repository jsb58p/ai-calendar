import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mockReqUser = vi.hoisted(() => ({
  current: { userId: 'admin-1', email: 'admin@example.com', isAdmin: true as boolean | undefined },
}))

const mockToArray = vi.hoisted(() => vi.fn())
const mockSort = vi.hoisted(() => vi.fn(() => ({ toArray: mockToArray })))
const mockFind = vi.hoisted(() => vi.fn(() => ({ sort: mockSort })))
const mockUpdateOne = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockDeleteOne = vi.hoisted(() => vi.fn().mockResolvedValue({ deletedCount: 1 }))
const mockDeleteMany = vi.hoisted(() => vi.fn().mockResolvedValue({ deletedCount: 0 }))
const mockCountDocuments = vi.hoisted(() => vi.fn().mockResolvedValue(0))

vi.mock('../middleware/auth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = mockReqUser.current
    next()
  },
  requireAdmin: (req: any, res: any, next: any) => {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: 'Admin access required' })
      return
    }
    next()
  },
}))

vi.mock('../services/db', () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn().mockResolvedValue(undefined),
  getDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      find: mockFind,
      updateOne: mockUpdateOne,
      deleteOne: mockDeleteOne,
      deleteMany: mockDeleteMany,
      countDocuments: mockCountDocuments,
    })),
  })),
}))

vi.mock('../services/email', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('uuid', () => ({ v4: vi.fn(() => 'mock-reset-token') }))

import { adminRouter } from '../routes/admin'
import { errorHandler } from '../middleware/errorHandler'
import { getUserById, updateUser } from '../services/db'
import { sendPasswordResetEmail } from '../services/email'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TARGET_USER = {
  id: 'user-2',
  email: 'user@example.com',
  displayName: 'Regular User',
  emailVerified: true,
  isAdmin: false,
  suspended: false,
  createdAt: '2026-01-02T00:00:00.000Z',
}

// ---------------------------------------------------------------------------
// Test app
// ---------------------------------------------------------------------------

const app = express()
app.use(express.json())
app.use('/api/admin', adminRouter)
app.use(errorHandler)

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  mockReqUser.current = { userId: 'admin-1', email: 'admin@example.com', isAdmin: true }
  vi.mocked(getUserById).mockResolvedValue(undefined)
  mockCountDocuments.mockResolvedValue(0)
  mockDeleteOne.mockResolvedValue({ deletedCount: 1 })
  mockDeleteMany.mockResolvedValue({ deletedCount: 0 })
  mockUpdateOne.mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/admin/users', () => {
  it('1: returns 403 when user does not have admin flag', async () => {
    mockReqUser.current = { userId: 'user-1', email: 'user@example.com', isAdmin: false }

    const res = await request(app).get('/api/admin/users')

    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/admin access required/i)
  })

  it('2: returns user list with goalCount when admin', async () => {
    mockToArray.mockResolvedValueOnce([TARGET_USER])
    mockCountDocuments.mockResolvedValueOnce(3)

    const res = await request(app).get('/api/admin/users')

    expect(res.status).toBe(200)
    expect(res.body.users).toHaveLength(1)
    expect(res.body.users[0].email).toBe('user@example.com')
    expect(res.body.users[0].goalCount).toBe(3)
    expect(res.body.users[0].passwordHash).toBeUndefined()
  })
})

describe('DELETE /api/admin/users/:userId', () => {
  it('3: cascades deletes and returns 200', async () => {
    const res = await request(app).delete('/api/admin/users/user-2')

    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/deleted/i)
    expect(mockDeleteMany).toHaveBeenCalledTimes(4) // goals, schedules, feedback, settings
    expect(mockDeleteOne).toHaveBeenCalledWith({ id: 'user-2' })
  })

  it('4: returns 400 when trying to delete own account', async () => {
    const res = await request(app).delete('/api/admin/users/admin-1')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/cannot delete your own/i)
  })
})

describe('PATCH /api/admin/users/:userId/suspend', () => {
  it('5: toggles suspended field and returns updated user', async () => {
    vi.mocked(getUserById).mockResolvedValueOnce(TARGET_USER)

    const res = await request(app).patch('/api/admin/users/user-2/suspend')

    expect(res.status).toBe(200)
    expect(vi.mocked(updateUser)).toHaveBeenCalledWith('user-2', { suspended: true })
    expect(res.body.user.suspended).toBe(true)
  })
})

describe('PATCH /api/admin/users/:userId/reset-password', () => {
  it('6: generates reset token and calls sendPasswordResetEmail', async () => {
    vi.mocked(getUserById).mockResolvedValueOnce(TARGET_USER)

    const res = await request(app).patch('/api/admin/users/user-2/reset-password')

    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/password reset email sent/i)
    expect(vi.mocked(updateUser)).toHaveBeenCalledWith('user-2', { passwordResetToken: 'mock-reset-token' })
    expect(vi.mocked(sendPasswordResetEmail)).toHaveBeenCalledWith(
      'user@example.com',
      'Regular User',
      'mock-reset-token'
    )
  })
})

describe('PATCH /api/admin/users/:userId/toggle-admin', () => {
  it('7: toggles isAdmin and returns updated user', async () => {
    vi.mocked(getUserById).mockResolvedValueOnce(TARGET_USER)

    const res = await request(app).patch('/api/admin/users/user-2/toggle-admin')

    expect(res.status).toBe(200)
    expect(vi.mocked(updateUser)).toHaveBeenCalledWith('user-2', { isAdmin: true })
    expect(res.body.user.isAdmin).toBe(true)
  })

  it('8: returns 400 when trying to toggle own admin status', async () => {
    const res = await request(app).patch('/api/admin/users/admin-1/toggle-admin')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/cannot toggle your own/i)
  })
})
