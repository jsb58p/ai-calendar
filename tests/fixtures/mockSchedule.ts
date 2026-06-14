import type { GoalInput, Schedule } from '../../frontend/src/types'

// Use UTC dates so they match parseISO() behaviour in the browser (timezoneId: 'UTC')
function utcDatePlusDays(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export const mockGoal: GoalInput = {
  id: 'goal-e2e-1',
  title: 'Learn TypeScript',
  description: 'Master TypeScript fundamentals in 30 days',
  targetDate: utcDatePlusDays(30),
  createdAt: new Date().toISOString(),
}

export const mockSchedule: Schedule = {
  goalId: 'goal-e2e-1',
  tasks: [
    {
      id: 'task-e2e-1',
      goalId: 'goal-e2e-1',
      title: 'Read TypeScript Handbook',
      description: 'Work through the official TypeScript documentation.',
      scheduledDate: utcDatePlusDays(0),
      estimatedMinutes: 60,
      status: 'pending',
      stepInstructions: ['Open the TypeScript Handbook', 'Read the basics section', 'Take notes'],
    },
    {
      id: 'task-e2e-2',
      goalId: 'goal-e2e-1',
      title: 'Practice basic types',
      description: 'Write TypeScript exercises using primitive types.',
      scheduledDate: utcDatePlusDays(1),
      estimatedMinutes: 45,
      status: 'pending',
      stepInstructions: ['Create a new TS file', 'Define variables with types', 'Run tsc to compile'],
    },
    {
      id: 'task-e2e-3',
      goalId: 'goal-e2e-1',
      title: 'Understand interfaces',
      description: 'Learn how to define and implement TypeScript interfaces.',
      scheduledDate: utcDatePlusDays(2),
      estimatedMinutes: 45,
      status: 'pending',
      stepInstructions: ['Read the interfaces docs', 'Create sample interfaces', 'Implement them in code'],
    },
    {
      id: 'task-e2e-4',
      goalId: 'goal-e2e-1',
      title: 'Explore generics',
      description: 'Study TypeScript generics and their use cases.',
      scheduledDate: utcDatePlusDays(4),
      estimatedMinutes: 60,
      status: 'pending',
      stepInstructions: ['Read generics documentation', 'Build a generic utility function', 'Write tests for it'],
    },
    {
      id: 'task-e2e-5',
      goalId: 'goal-e2e-1',
      title: 'Build a mini project',
      description: 'Apply TypeScript knowledge in a small end-to-end project.',
      scheduledDate: utcDatePlusDays(6),
      estimatedMinutes: 90,
      status: 'pending',
      stepInstructions: ['Choose a project idea', 'Set up the TypeScript project', 'Implement and test'],
    },
  ],
}
