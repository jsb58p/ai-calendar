import { MongoClient, Db } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import type { GoalInput, Schedule, FeedbackEntry, UserSettings, User } from '../models/types'

let mongoClient: MongoClient | null = null
let database: Db | null = null

export async function initDb(): Promise<void> {
  const uri = process.env['MONGODB_URI']
  if (!uri) throw new Error('MONGODB_URI environment variable is required')
  mongoClient = new MongoClient(uri)
  await mongoClient.connect()
  database = mongoClient.db('schedulerAI')
  await database.collection('goals').createIndex({ id: 1, userId: 1 }, { unique: true })
  await database.collection('schedules').createIndex({ goalId: 1, userId: 1 }, { unique: true })
  await database.collection('feedback').createIndex({ scheduleId: 1 })
  await database.collection('users').createIndex({ id: 1 }, { unique: true })
  await database.collection('users').createIndex({ email: 1 }, { unique: true })
}

export function getDb(): Db {
  if (!database) throw new Error('Database not initialized — call initDb() before use')
  return database
}

// Goals — userId-scoped

export async function saveGoal(goal: GoalInput, userId: string): Promise<void> {
  await getDb()
    .collection('goals')
    .replaceOne({ id: goal.id, userId }, { ...goal, userId }, { upsert: true })
}

export async function getGoal(id: string, userId: string): Promise<GoalInput | undefined> {
  const doc = await getDb()
    .collection('goals')
    .findOne({ id, userId }, { projection: { _id: 0 } })
  return (doc as GoalInput | null) ?? undefined
}

export async function getAllGoals(userId: string): Promise<GoalInput[]> {
  const docs = await getDb()
    .collection('goals')
    .find({ userId }, { projection: { _id: 0 } })
    .toArray()
  return docs as unknown as GoalInput[]
}

// Schedules — userId-scoped

export async function saveSchedule(schedule: Schedule, userId: string): Promise<void> {
  await getDb()
    .collection('schedules')
    .replaceOne({ goalId: schedule.goalId, userId }, { ...schedule, userId }, { upsert: true })
}

export async function getSchedule(goalId: string, userId: string): Promise<Schedule | undefined> {
  const doc = await getDb()
    .collection('schedules')
    .findOne({ goalId, userId }, { projection: { _id: 0, userId: 0 } })
  return (doc as Schedule | null) ?? undefined
}

// Feedback — userId-scoped

export async function saveFeedback(entry: FeedbackEntry, userId: string): Promise<void> {
  await getDb().collection('feedback').insertOne({ ...entry, userId })
}

export async function getFeedbackForSchedule(scheduleId: string, userId: string): Promise<FeedbackEntry[]> {
  const docs = await getDb()
    .collection('feedback')
    .find({ scheduleId, userId }, { projection: { _id: 0, userId: 0 } })
    .toArray()
  return docs as unknown as FeedbackEntry[]
}

// Settings — userId-scoped

export async function saveSettings(goalId: string, settings: UserSettings, userId: string): Promise<void> {
  await getDb()
    .collection('settings')
    .replaceOne({ goalId, userId }, { goalId, userId, ...settings }, { upsert: true })
}

export async function getSettings(goalId: string, userId: string): Promise<UserSettings | undefined> {
  const doc = await getDb()
    .collection('settings')
    .findOne({ goalId, userId }, { projection: { _id: 0, goalId: 0, userId: 0 } })
  return (doc as UserSettings | null) ?? undefined
}

// Users — not userId-scoped (looked up by their own identifiers)

export async function saveUser(user: User): Promise<void> {
  await getDb().collection('users').replaceOne({ id: user.id }, { ...user }, { upsert: true })
}

export async function getUserById(id: string): Promise<User | undefined> {
  const doc = await getDb().collection('users').findOne({ id }, { projection: { _id: 0 } })
  return (doc as User | null) ?? undefined
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const doc = await getDb().collection('users').findOne({ email }, { projection: { _id: 0 } })
  return (doc as User | null) ?? undefined
}

export async function getUserByGoogleId(googleId: string): Promise<User | undefined> {
  const doc = await getDb().collection('users').findOne({ googleId }, { projection: { _id: 0 } })
  return (doc as User | null) ?? undefined
}

export async function updateUser(id: string, patch: Partial<User>): Promise<void> {
  await getDb().collection('users').updateOne({ id }, { $set: patch })
}

export { uuidv4 }
