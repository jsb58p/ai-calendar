import { describe, it, expect } from 'vitest'
import { computeDiff } from '../utils/diff'
import type { Task, Schedule } from '../types'

function makeTask(id: string, scheduledDate: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    goalId: 'goal-1',
    title: `Task ${id}`,
    description: 'desc',
    scheduledDate,
    estimatedMinutes: 30,
    status: 'pending',
    stepInstructions: [],
    ...overrides,
  }
}

function makeSchedule(tasks: Task[]): Schedule {
  return { goalId: 'goal-1', tasks }
}

describe('computeDiff', () => {
  it('returns empty array for identical schedules', () => {
    const s = makeSchedule([makeTask('t1', '2026-07-01'), makeTask('t2', '2026-07-02')])
    expect(computeDiff(s, s)).toEqual([])
  })

  it('detects a rescheduled task with correct oldDate and newDate', () => {
    const oldS = makeSchedule([makeTask('t1', '2026-07-01')])
    const newS = makeSchedule([makeTask('t1', '2026-07-05')])
    const result = computeDiff(oldS, newS)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      type: 'rescheduled',
      oldDate: '2026-07-01',
      newDate: '2026-07-05',
    })
    expect(result[0]!.task.id).toBe('t1')
  })

  it('detects a task present in new but not old as added', () => {
    const oldS = makeSchedule([])
    const newS = makeSchedule([makeTask('t2', '2026-07-03')])
    const result = computeDiff(oldS, newS)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ type: 'added', task: expect.objectContaining({ id: 't2' }) })
  })

  it('detects a task present in old but not new as removed', () => {
    const oldS = makeSchedule([makeTask('t3', '2026-07-04')])
    const newS = makeSchedule([])
    const result = computeDiff(oldS, newS)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ type: 'removed', task: expect.objectContaining({ id: 't3' }) })
  })

  it('excludes unchanged tasks from the result', () => {
    const task = makeTask('t1', '2026-07-01')
    const s = makeSchedule([task])
    expect(computeDiff(s, s)).toHaveLength(0)
  })

  it('returns multiple changes in order: rescheduled, added, removed', () => {
    const oldS = makeSchedule([
      makeTask('t1', '2026-07-01'), // will be rescheduled
      makeTask('t2', '2026-07-02'), // will be removed
      makeTask('t3', '2026-07-03'), // unchanged
    ])
    const newS = makeSchedule([
      makeTask('t1', '2026-07-10'), // rescheduled
      makeTask('t3', '2026-07-03'), // unchanged
      makeTask('t4', '2026-07-04'), // added
    ])
    const result = computeDiff(oldS, newS)
    expect(result).toHaveLength(3)
    expect(result[0]!.type).toBe('rescheduled')
    expect(result[1]!.type).toBe('added')
    expect(result[2]!.type).toBe('removed')
  })
})
