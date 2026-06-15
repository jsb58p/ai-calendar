import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import type { AuthTokenPayload } from '../models/types'

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload
    }
  }
}

export function generateToken(payload: AuthTokenPayload): string {
  const secret = process.env['JWT_SECRET']
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  const expiresIn = process.env['JWT_EXPIRES_IN'] ?? '7d'
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions)
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

export function clearAuthCookie(res: Response): void {
  res.cookie('auth_token', '', {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token: string | undefined = req.cookies?.['auth_token']
  if (!token) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  try {
    const secret = process.env['JWT_SECRET']
    if (!secret) throw new Error('JWT_SECRET not set')
    const decoded = jwt.verify(token, secret)
    req.user = decoded as AuthTokenPayload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' })
  }
}
