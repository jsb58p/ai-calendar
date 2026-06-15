import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import cookieParser from 'cookie-parser'

// ---------------------------------------------------------------------------
// Hoisted so the getDb chain mock is accessible inside the vi.mock factory
// and also in test bodies (for verify-email tests).
// ---------------------------------------------------------------------------
const mockFindOne = vi.hoisted(() => vi.fn())

vi.mock('../services/db', () => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  getUserByGoogleId: vi.fn(),
  saveUser: vi.fn().mockResolvedValue(undefined),
  updateUser: vi.fn().mockResolvedValue(undefined),
  getDb: vi.fn(() => ({
    collection: vi.fn(() => ({ findOne: mockFindOne })),
  })),
}))

vi.mock('../services/email', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
    verify: vi.fn().mockReturnValue({ userId: 'user-1', email: 'test@example.com' }),
  },
}))

vi.mock('../services/googleCalendar', () => ({
  getGoogleAuthUrl: vi.fn().mockReturnValue('https://accounts.google.com/auth'),
  getGoogleUserInfo: vi.fn(),
  getAuthOAuthClient: vi.fn(),
  getOAuthClient: vi.fn(),
  getAuthUrl: vi.fn(),
  exchangeCode: vi.fn(),
  createCalendarEvent: vi.fn(),
  deleteCalendarEvent: vi.fn(),
  updateCalendarEvent: vi.fn(),
}))

import { authUsersRouter } from '../routes/auth-users'
import { errorHandler } from '../middleware/errorHandler'
import { getUserByEmail, getUserById, updateUser } from '../services/db'
import { sendVerificationEmail } from '../services/email'
import jwt from 'jsonwebtoken'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  displayName: 'Test User',
  emailVerified: false,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const MOCK_GOOGLE_USER = {
  id: 'user-2',
  email: 'google@example.com',
  googleId: 'google-sub-123',
  displayName: 'Google User',
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
}

// ---------------------------------------------------------------------------
// Test app
// ---------------------------------------------------------------------------

const app = express()
app.use(cookieParser())
app.use(express.json())
app.use('/api/auth/users', authUsersRouter)
app.use(errorHandler)

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  process.env['JWT_SECRET'] = 'test-secret-that-is-long-enough-for-jwt'
  process.env['JWT_EXPIRES_IN'] = '7d'
  // Default: no existing user, bcrypt resolves, jwt works
  vi.mocked(getUserByEmail).mockResolvedValue(undefined)
  vi.mocked(getUserById).mockResolvedValue(undefined)
  mockFindOne.mockResolvedValue(null)
})

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

describe('POST /api/auth/users/register', () => {
  it('1: valid body returns 201 with safe user object (no passwordHash)', async () => {
    const res = await request(app)
      .post('/api/auth/users/register')
      .send({ email: 'new@example.com', password: 'securepass', displayName: 'New User' })

    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({
      email: 'new@example.com',
      displayName: 'New User',
      emailVerified: false,
    })
    expect(res.body.user.id).toBeDefined()
    expect(res.body.user.passwordHash).toBeUndefined()
    expect(res.body.user.verificationToken).toBeUndefined()
  })

  it('2: missing email returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/users/register')
      .send({ password: 'securepass', displayName: 'New User' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/email/i)
  })

  it('3: password less than 8 chars returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/users/register')
      .send({ email: 'new@example.com', password: 'short', displayName: 'New User' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/8 char/i)
  })

  it('4: existing email returns 409', async () => {
    vi.mocked(getUserByEmail).mockResolvedValueOnce(MOCK_USER)

    const res = await request(app)
      .post('/api/auth/users/register')
      .send({ email: 'test@example.com', password: 'securepass', displayName: 'New User' })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already registered/i)
  })

  it('5: calls sendVerificationEmail with the registered email and displayName', async () => {
    await request(app)
      .post('/api/auth/users/register')
      .send({ email: 'verify@example.com', password: 'securepass', displayName: 'Verify Me' })

    expect(vi.mocked(sendVerificationEmail)).toHaveBeenCalledOnce()
    const [toArg, nameArg] = vi.mocked(sendVerificationEmail).mock.calls[0]!
    expect(toArg).toBe('verify@example.com')
    expect(nameArg).toBe('Verify Me')
  })

  it('6: sets auth_token httpOnly cookie in response', async () => {
    const res = await request(app)
      .post('/api/auth/users/register')
      .send({ email: 'cookie@example.com', password: 'securepass', displayName: 'Cookie User' })

    expect(res.status).toBe(201)
    const cookies: string[] = res.headers['set-cookie'] as unknown as string[]
    expect(cookies).toBeDefined()
    const authCookie = cookies.find((c) => c.startsWith('auth_token='))
    expect(authCookie).toBeDefined()
    expect(authCookie).toMatch(/HttpOnly/i)
  })
})

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

describe('POST /api/auth/users/login', () => {
  it('7: valid credentials returns 200 with safe user object', async () => {
    vi.mocked(getUserByEmail).mockResolvedValueOnce(MOCK_USER)

    const res = await request(app)
      .post('/api/auth/users/login')
      .send({ email: 'test@example.com', password: 'securepass' })

    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
    })
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('8: wrong password returns 401', async () => {
    vi.mocked(getUserByEmail).mockResolvedValueOnce(MOCK_USER)
    // Override the default bcrypt.compare true → false for this test
    const bcrypt = (await import('bcryptjs')).default
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never)

    const res = await request(app)
      .post('/api/auth/users/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/invalid email or password/i)
  })

  it('9: unknown email returns 401', async () => {
    vi.mocked(getUserByEmail).mockResolvedValueOnce(undefined)

    const res = await request(app)
      .post('/api/auth/users/login')
      .send({ email: 'nobody@example.com', password: 'securepass' })

    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/invalid email or password/i)
  })

  it('10: Google-only account (no passwordHash) returns 400 with Google Sign-In message', async () => {
    vi.mocked(getUserByEmail).mockResolvedValueOnce(MOCK_GOOGLE_USER)

    const res = await request(app)
      .post('/api/auth/users/login')
      .send({ email: 'google@example.com', password: 'anypassword' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/google sign-in/i)
  })
})

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

describe('POST /api/auth/users/logout', () => {
  it('11: clears auth_token cookie and returns 200', async () => {
    const res = await request(app)
      .post('/api/auth/users/logout')
      .set('Cookie', 'auth_token=mock-jwt-token')

    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/logged out/i)
    const cookies: string[] = res.headers['set-cookie'] as unknown as string[]
    const cleared = cookies?.find((c) => c.startsWith('auth_token='))
    expect(cleared).toBeDefined()
    // maxAge=0 serialises as "Expires=Thu, 01 Jan 1970..." or "Max-Age=0"
    expect(cleared).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i)
  })
})

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

describe('GET /api/auth/users/verify-email', () => {
  it('12: valid token updates emailVerified and redirects', async () => {
    mockFindOne.mockResolvedValueOnce(MOCK_USER)

    const res = await request(app)
      .get('/api/auth/users/verify-email?token=valid-verification-token')

    expect(res.status).toBe(302)
    expect(res.headers['location']).toMatch(/\/verified$/)
    expect(vi.mocked(updateUser)).toHaveBeenCalledWith(MOCK_USER.id, {
      emailVerified: true,
      verificationToken: undefined,
    })
  })

  it('13: invalid token returns 400', async () => {
    mockFindOne.mockResolvedValueOnce(null)

    const res = await request(app)
      .get('/api/auth/users/verify-email?token=bad-token')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/invalid or expired/i)
  })
})

// ---------------------------------------------------------------------------
// GET /me — session check
// ---------------------------------------------------------------------------

describe('GET /api/auth/users/me', () => {
  it('14: valid auth_token cookie returns 200 with user object', async () => {
    vi.mocked(getUserById).mockResolvedValueOnce(MOCK_USER)

    const res = await request(app)
      .get('/api/auth/users/me')
      .set('Cookie', 'auth_token=mock-jwt-token')

    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
    })
    expect(res.body.user.passwordHash).toBeUndefined()
  })

  it('15: no cookie returns 401', async () => {
    const res = await request(app).get('/api/auth/users/me')

    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/authentication required/i)
  })

  it('16: invalid token returns 401', async () => {
    vi.mocked(jwt.verify).mockImplementationOnce(() => {
      throw new Error('jwt malformed')
    })

    const res = await request(app)
      .get('/api/auth/users/me')
      .set('Cookie', 'auth_token=bad-token')

    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/invalid or expired session/i)
  })
})
