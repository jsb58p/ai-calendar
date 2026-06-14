import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDb } from './services/db'
import { errorHandler } from './middleware/errorHandler'
import { goalsRouter } from './routes/goals'
import { feedbackRouter } from './routes/feedback'
import { authRouter } from './routes/auth'

const app = express()

app.use(express.json())
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }))

app.use('/api/goals', goalsRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/auth', authRouter)

app.use(errorHandler)

const PORT = process.env['PORT'] ?? 3001

async function start() {
  await initDb()
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`)
  })
}

start().catch(console.error)
