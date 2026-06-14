import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { getAuthUrl, exchangeCode } from '../services/googleCalendar'

export const authRouter = Router()

// GET /api/auth/google — redirect to Google OAuth consent screen
authRouter.get('/google', (_req: Request, res: Response) => {
  const url = getAuthUrl('calendar-sync')
  res.redirect(url)
})

// GET /api/auth/google/callback — exchange auth code for tokens
authRouter.get('/google/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.query['code']
    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'No code provided' })
      return
    }

    const { access_token, refresh_token } = await exchangeCode(code)
    res.status(200).json({ access_token, refresh_token })
  } catch (err) {
    next(err)
  }
})
