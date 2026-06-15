import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { initDb } from './services/db'
import { errorHandler } from './middleware/errorHandler'
import { goalsRouter } from './routes/goals'
import { feedbackRouter } from './routes/feedback'
import { authRouter } from './routes/auth'
import { authUsersRouter } from './routes/auth-users'
import { calendarRouter } from './routes/calendar'
import { adminRouter } from './routes/admin'

const app = express()

app.use(cookieParser())
app.use(express.json())
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env['FRONTEND_URL'],
].filter(Boolean) as string[]

app.use(cors({ origin: allowedOrigins, credentials: true }))

app.use('/api/goals', goalsRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/auth', authRouter)
app.use('/api/auth/users', authUsersRouter)
app.use('/api/calendar', calendarRouter)
app.use('/api/admin', adminRouter)

app.use(errorHandler)

const PORT = process.env['PORT'] ?? 3001

async function start() {
  await initDb()
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`)
  })
}

start().catch(console.error)
