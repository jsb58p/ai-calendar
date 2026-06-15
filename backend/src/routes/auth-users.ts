import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import {
  getUserByEmail,
  getUserById,
  getUserByGoogleId,
  saveUser,
  updateUser,
  getDb,
} from '../services/db'
import { sendVerificationEmail } from '../services/email'
import { generateToken, setAuthCookie, clearAuthCookie, requireAuth } from '../middleware/auth'
import { getGoogleAuthUrl, getGoogleUserInfo } from '../services/googleCalendar'
import type { User } from '../models/types'

export const authUsersRouter = Router()

function safeUser(user: User) {
  return { id: user.id, email: user.email, displayName: user.displayName, emailVerified: user.emailVerified }
}

// POST /register
authUsersRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, displayName } = req.body as Record<string, unknown>

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Valid email address is required' })
      return
    }
    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' })
      return
    }
    if (typeof displayName !== 'string' || displayName.trim().length < 2) {
      res.status(400).json({ error: 'Display name must be at least 2 characters' })
      return
    }

    const existing = await getUserByEmail(email)
    if (existing) {
      res.status(409).json({ error: 'Email already registered' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const verificationToken = uuidv4()
    const user: User = {
      id: uuidv4(),
      email,
      passwordHash,
      displayName: displayName.trim(),
      emailVerified: false,
      verificationToken,
      createdAt: new Date().toISOString(),
    }

    await saveUser(user)
    await sendVerificationEmail(email, user.displayName, verificationToken)

    const token = generateToken({ userId: user.id, email: user.email })
    setAuthCookie(res, token)

    res.status(201).json({
      user: safeUser(user),
      message: 'Account created. Please verify your email.',
    })
  } catch (err) {
    next(err)
  }
})

// POST /login
authUsersRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as Record<string, unknown>

    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    const user = await getUserByEmail(email)
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    if (!user.passwordHash) {
      res.status(400).json({ error: 'This account uses Google Sign-In. Please sign in with Google.' })
      return
    }

    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const token = generateToken({ userId: user.id, email: user.email })
    setAuthCookie(res, token)

    res.status(200).json({ user: safeUser(user) })
  } catch (err) {
    next(err)
  }
})

// POST /logout
authUsersRouter.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res)
  res.status(200).json({ message: 'Logged out' })
})

// GET /verify-email?token=xxx
authUsersRouter.get('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query as Record<string, unknown>

    if (typeof token !== 'string' || !token) {
      res.status(400).json({ error: 'Invalid or expired verification token' })
      return
    }

    const doc = await getDb().collection('users').findOne({ verificationToken: token }, { projection: { _id: 0 } })
    if (!doc) {
      res.status(400).json({ error: 'Invalid or expired verification token' })
      return
    }

    const user = doc as User
    await updateUser(user.id, { emailVerified: true, verificationToken: undefined })

    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:5173'
    res.redirect(`${frontendUrl}/verified`)
  } catch (err) {
    next(err)
  }
})

// GET /me
authUsersRouter.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.user!.userId)
    if (!user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }
    res.status(200).json({ user: safeUser(user) })
  } catch (err) {
    next(err)
  }
})

// GET /google
authUsersRouter.get('/google', (_req: Request, res: Response) => {
  res.redirect(getGoogleAuthUrl())
})

// GET /google/callback
authUsersRouter.get('/google/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query as Record<string, unknown>
    if (typeof code !== 'string' || !code) {
      res.status(400).json({ error: 'No code provided' })
      return
    }

    const { googleId, email, displayName } = await getGoogleUserInfo(code)
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:5173'

    let user = await getUserByGoogleId(googleId)

    if (user) {
      // Existing Google user — refresh display name in case it changed
      await updateUser(user.id, { displayName })
      user = { ...user, displayName }
    } else {
      const byEmail = await getUserByEmail(email)
      if (byEmail) {
        // Password account with same email — link Google ID
        await updateUser(byEmail.id, { googleId })
        user = { ...byEmail, googleId }
      } else {
        // Brand new user via Google
        const newUser: User = {
          id: uuidv4(),
          email,
          googleId,
          displayName,
          emailVerified: true,
          createdAt: new Date().toISOString(),
        }
        await saveUser(newUser)
        user = newUser
      }
    }

    const token = generateToken({ userId: user.id, email: user.email })
    setAuthCookie(res, token)
    res.redirect(frontendUrl)
  } catch (err) {
    next(err)
  }
})

// POST /resend-verification
authUsersRouter.post('/resend-verification', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.user!.userId)
    if (!user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    if (user.emailVerified) {
      res.status(400).json({ error: 'Email already verified' })
      return
    }

    const verificationToken = uuidv4()
    await updateUser(user.id, { verificationToken })
    await sendVerificationEmail(user.email, user.displayName, verificationToken)

    res.status(200).json({ message: 'Verification email sent' })
  } catch (err) {
    next(err)
  }
})
