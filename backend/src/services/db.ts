import { MongoClient, Db } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import type { GoalInput, Schedule, FeedbackEntry, UserSettings } from '../models/types'

let mongoClient: MongoClient | null = null
let database: Db | null = null

export async function initDb(): Promise<void> {
  const uri = process.env['MONGODB_URI']
  if (!uri) throw new Error('MONGODB_URI environment variable is required')
  mongoClient = new MongoClient(uri)
  await mongoClient.connect()
  database = mongoClient.db('schedulerAI')
  await database.collection('goals').createIndex({ id: 1 }, { unique: true })
  await database.collection('schedules').createIndex({ goalId: 1 }, { unique: true })
  await database.collection('feedback').createIndex({ scheduleId: 1 })
}

export function getDb(): Db {
  if (!database) throw new Error('Database not initialized — call initDb() before use')
  return database
}

export async function saveGoal(goal: GoalInput): Promise<void> {
  await getDb().collection('goals').replaceOne({ id: goal.id }, { ...goal }, { upsert: true })
}

export async function getGoal(id: string): Promise<GoalInput | undefined> {
  const doc = await getDb().collection('goals').findOne({ id }, { projection: { _id: 0 } })
  return (doc as GoalInput | null) ?? undefined
}

export async function saveSchedule(schedule: Schedule): Promise<void> {
  await getDb()
    .collection('schedules')
    .replaceOne({ goalId: schedule.goalId }, { ...schedule }, { upsert: true })
}

export async function getSchedule(goalId: string): Promise<Schedule | undefined> {
  const doc = await getDb()
    .collection('schedules')
    .findOne({ goalId }, { projection: { _id: 0 } })
  return (doc as Schedule | null) ?? undefined
}

export async function saveFeedback(entry: FeedbackEntry): Promise<void> {
  await getDb().collection('feedback').insertOne({ ...entry })
}

export async function getFeedbackForSchedule(scheduleId: string): Promise<FeedbackEntry[]> {
  const docs = await getDb()
    .collection('feedback')
    .find({ scheduleId }, { projection: { _id: 0 } })
    .toArray()
  return docs as unknown as FeedbackEntry[]
}

export async function saveSettings(goalId: string, settings: UserSettings): Promise<void> {
  await getDb()
    .collection('settings')
    .replaceOne({ goalId }, { goalId, ...settings }, { upsert: true })
}

export async function getSettings(goalId: string): Promise<UserSettings | undefined> {
  const doc = await getDb()
    .collection('settings')
    .findOne({ goalId }, { projection: { _id: 0, goalId: 0 } })
  return (doc as UserSettings | null) ?? undefined
}

export async function getAllGoals(): Promise<GoalInput[]> {
  const docs = await getDb()
    .collection('goals')
    .find({}, { projection: { _id: 0 } })
    .toArray()
  return docs as unknown as GoalInput[]
}

export { uuidv4 }
