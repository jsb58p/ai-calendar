import fs from 'node:fs'
import path from 'node:path'
import type { DBSchema } from '../models/types'

const DB_PATH = path.resolve('db.json')
const defaultData: DBSchema = { goals: [], schedules: [], feedback: [] }

export function readDb(): DBSchema {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(raw) as DBSchema
  } catch {
    return structuredClone(defaultData)
  }
}

export function writeDb(data: DBSchema): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}
