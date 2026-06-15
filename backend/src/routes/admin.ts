import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb, getUserById, updateUser } from '../services/db'
import { sendPasswordResetEmail } from '../services/email'
import { requireAuth, requireAdmin } from '../middleware/auth'
import type { User } from '../models/types'

export const adminRouter = Router()

function safeAdminUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    isAdmin: user.isAdmin,
    suspended: user.suspended,
    createdAt: user.createdAt,
  }
}

// GET /api/admin/users
adminRouter.get('/users', requireAuth, requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await getDb()
      .collection('users')
      .find({})
      .sort({ createdAt: -1 })
      .toArray() as unknown as User[]

    const result = await Promise.all(
      users.map(async (user) => {
        const goalCount = await getDb().collection('goals').countDocuments({ userId: user.id })
        return { ...safeAdminUser(user), goalCount }
      })
    )

    res.json({ users: result })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/admin/users/:userId
adminRouter.delete('/users/:userId', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params as { userId: string }

    if (req.user!.userId === userId) {
      res.status(400).json({ error: 'Cannot delete your own account' })
      return
    }

    const db = getDb()
    await db.collection('goals').deleteMany({ userId })
    await db.collection('schedules').deleteMany({ userId })
    await db.collection('feedback').deleteMany({ userId })
    await db.collection('settings').deleteMany({ userId })
    await db.collection('users').deleteOne({ id: userId })

    res.json({ message: 'User deleted' })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/admin/users/:userId/suspend
adminRouter.patch('/users/:userId/suspend', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params as { userId: string }

    const user = await getUserById(userId)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    await updateUser(userId, { suspended: !user.suspended })
    res.json({ user: { ...safeAdminUser(user), suspended: !user.suspended } })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/admin/users/:userId/reset-password
adminRouter.patch('/users/:userId/reset-password', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params as { userId: string }

    const user = await getUserById(userId)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const passwordResetToken = uuidv4()
    await updateUser(userId, { passwordResetToken })
    await sendPasswordResetEmail(user.email, user.displayName, passwordResetToken)

    res.json({ message: 'Password reset email sent' })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/admin/users/:userId/toggle-admin
adminRouter.patch('/users/:userId/toggle-admin', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params as { userId: string }

    if (req.user!.userId === userId) {
      res.status(400).json({ error: 'Cannot toggle your own admin status' })
      return
    }

    const user = await getUserById(userId)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    await updateUser(userId, { isAdmin: !user.isAdmin })
    res.json({ user: { ...safeAdminUser(user), isAdmin: !user.isAdmin } })
  } catch (err) {
    next(err)
  }
})
