import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'
import type { DBSchema, GoalInput, Schedule, FeedbackEntry, UserSettings } from '../models/types'
import path from 'node:path'

const DB_PATH = path.resolve('db.json')
const defaultData: DBSchema = { goals: [], schedules: [], feedback: [], settings: {} }

let db: Low<DBSchema> | null = null

export async function initDb(): Promise<void> {
  const adapter = new JSONFile<DBSchema>(DB_PATH)
  db = new Low<DBSchema>(adapter, structuredClone(defaultData))
  await db.read()
  // Migrate existing databases that predate the settings field
  if (!db.data.settings) {
    db.data.settings = {}
    await db.write()
  }
}

export function getDb(): Low<DBSchema> {
  if (!db) throw new Error('Database not initialized — call initDb() before use')
  return db
}

export async function saveGoal(goal: GoalInput): Promise<void> {
  const database = getDb()
  await database.read()
  database.data.goals.push(goal)
  await database.write()
}

export async function getGoal(id: string): Promise<GoalInput | undefined> {
  const database = getDb()
  await database.read()
  return database.data.goals.find((g) => g.id === id)
}

export async function saveSchedule(schedule: Schedule): Promise<void> {
  const database = getDb()
  await database.read()
  const index = database.data.schedules.findIndex((s) => s.goalId === schedule.goalId)
  if (index !== -1) {
    database.data.schedules.splice(index, 1, schedule)
  } else {
    database.data.schedules.push(schedule)
  }
  await database.write()
}

export async function getSchedule(goalId: string): Promise<Schedule | undefined> {
  const database = getDb()
  await database.read()
  return database.data.schedules.find((s) => s.goalId === goalId)
}

export async function saveFeedback(entry: FeedbackEntry): Promise<void> {
  const database = getDb()
  await database.read()
  database.data.feedback.push(entry)
  await database.write()
}

export async function getFeedbackForSchedule(scheduleId: string): Promise<FeedbackEntry[]> {
  const database = getDb()
  await database.read()
  return database.data.feedback.filter((f) => f.scheduleId === scheduleId)
}

export async function saveSettings(goalId: string, settings: UserSettings): Promise<void> {
  const database = getDb()
  await database.read()
  database.data.settings[goalId] = settings
  await database.write()
}

export async function getSettings(goalId: string): Promise<UserSettings | undefined> {
  const database = getDb()
  await database.read()
  return database.data.settings[goalId]
}

export { uuidv4 }
