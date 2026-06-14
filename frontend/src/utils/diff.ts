import type { Task, Schedule } from '../types'

export type DiffEntry = {
  type: 'added' | 'removed' | 'rescheduled' | 'unchanged'
  task: Task
  oldDate?: string
  newDate?: string
}

const TYPE_ORDER: Record<DiffEntry['type'], number> = {
  rescheduled: 0,
  added: 1,
  removed: 2,
  unchanged: 3,
}

export function computeDiff(oldSchedule: Schedule, newSchedule: Schedule): DiffEntry[] {
  const oldMap = new Map<string, Task>(oldSchedule.tasks.map((t) => [t.id, t]))
  const newMap = new Map<string, Task>(newSchedule.tasks.map((t) => [t.id, t]))

  const entries: DiffEntry[] = []

  for (const [id, task] of newMap) {
    const oldTask = oldMap.get(id)
    if (!oldTask) {
      entries.push({ type: 'added', task })
    } else if (oldTask.scheduledDate !== task.scheduledDate) {
      entries.push({ type: 'rescheduled', task, oldDate: oldTask.scheduledDate, newDate: task.scheduledDate })
    }
    // unchanged tasks are excluded
  }

  for (const [id, task] of oldMap) {
    if (!newMap.has(id)) {
      entries.push({ type: 'removed', task })
    }
  }

  return entries.sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type])
}
