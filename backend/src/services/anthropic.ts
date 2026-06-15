import Anthropic from '@anthropic-ai/sdk'
import type { GoalInput, Schedule, FeedbackEntry, AdaptedSchedule, UserSettings } from '../models/types'
import { DEFAULT_SETTINGS } from '../models/types'

const client = new Anthropic()

const GENERATE_SYSTEM_PROMPT =
  "You are a scheduling assistant. Given a goal, generate a realistic, detailed schedule broken into daily tasks. Respond ONLY with valid JSON — no markdown, no code fences, no explanation. The JSON must match this exact schema: { goalId: string, tasks: [{ id: string, goalId: string, title: string, description: string, scheduledDate: string (ISO 8601 date only, e.g. 2025-06-15), estimatedMinutes: number, status: 'pending', stepInstructions: string[] (exactly 3 steps per task, each step no longer than 2 sentences), completedSteps: [], googleCalendarEventId: null }] } Generate between 8 and 12 tasks total. Do not generate more than 12 tasks. Keep stepInstructions to exactly 3 steps per task, each step no longer than 2 sentences. Format stepInstructions using markdown. Use **bold** for important terms, `code` for technical terms, file names, or commands. Use numbered sub-steps if a step has multiple parts. Do not wrap the JSON in markdown code fences or any other formatting. Return only the raw JSON object."

const ADAPT_SYSTEM_PROMPT =
  "You are a scheduling assistant. The user has rated their current schedule and provided feedback. Adapt the schedule to better meet their needs. Only reschedule tasks that are still 'pending'. Do not change tasks with status 'complete' or 'skipped'. Respond ONLY with valid JSON matching this schema: { goalId: string, tasks: [...same Task schema...], changesExplained: string (1-3 sentences explaining what you changed and why) } Do not wrap the JSON in markdown code fences or any other formatting. Return only the raw JSON object."

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function stripCodeFences(text: string): string {
  let s = text.trim()
  if (s.startsWith('```')) {
    const newline = s.indexOf('\n')
    s = newline === -1 ? '' : s.slice(newline + 1)
  }
  if (s.endsWith('```')) {
    s = s.slice(0, s.lastIndexOf('```')).trimEnd()
  }
  return s
}

function buildConstraintsBlock(settings: UserSettings): string {
  const availableDayNames = settings.availableDays.map((d) => DAY_NAMES[d]).join(', ')

  const difficultyDirective =
    settings.difficultyRamp === 'easy-to-hard'
      ? 'Start with easier foundational tasks and progressively increase difficulty.'
      : settings.difficultyRamp === 'hard-to-easy'
        ? 'Begin with the most challenging tasks while energy is highest, then decrease difficulty.'
        : 'Keep consistent difficulty throughout.'

  const blackoutLine =
    settings.blackoutDates.length > 0 ? settings.blackoutDates.join(', ') : 'None'

  return (
    `\nSCHEDULING CONSTRAINTS — These are hard requirements. Do not schedule tasks outside these constraints:\n` +
    `- Available days: ${availableDayNames} only. Never schedule tasks on other days.\n` +
    `- Daily window: ${settings.dailyStartTime} to ${settings.dailyEndTime} (${settings.timezone})\n` +
    `- Task duration: minimum ${settings.minTaskDuration} minutes, maximum ${settings.maxTaskDuration} minutes per task. Set estimatedMinutes within this range.\n` +
    `- Difficulty progression: ${difficultyDirective}\n` +
    `- Blackout dates: ${blackoutLine} — do not schedule tasks on these dates.\n` +
    `- Schedule a review/checkpoint task every ${DAY_NAMES[settings.weeklyReviewDay]} if possible.\n`
  )
}

export async function generateSchedule(
  goal: GoalInput,
  settings: UserSettings = DEFAULT_SETTINGS
): Promise<Schedule> {
  const today = new Date().toISOString().substring(0, 10)

  const userPrompt =
    `Generate a detailed schedule for the following goal.\n` +
    `Goal ID: ${goal.id}\n` +
    `Title: ${goal.title}\n` +
    `Description: ${goal.description}\n` +
    `Target Date: ${goal.targetDate}\n` +
    buildConstraintsBlock(settings) +
    `\nSpread tasks evenly from today (${today}) through the target date. ` +
    `Each task must include 3-7 stepInstructions. Return JSON only.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: GENERATE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const block = response.content[0]
  if (!block || block.type !== 'text') {
    throw new Error('Anthropic returned no text content for generateSchedule')
  }

  const cleaned = stripCodeFences(block.text)
  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(
      `generateSchedule: failed to parse Anthropic response as JSON. ` +
        `Preview: ${cleaned.substring(0, 300)}`
    )
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('goalId' in parsed) ||
    !('tasks' in parsed) ||
    !Array.isArray((parsed as Record<string, unknown>)['tasks'])
  ) {
    throw new Error(
      'generateSchedule: Anthropic response is missing required fields "goalId" and/or "tasks" array'
    )
  }

  return parsed as Schedule
}

export async function adaptSchedule(
  schedule: Schedule,
  feedback: FeedbackEntry,
  settings: UserSettings = DEFAULT_SETTINGS
): Promise<AdaptedSchedule> {
  const userPrompt =
    `Current schedule:\n${JSON.stringify(schedule, null, 2)}\n\n` +
    `User feedback:\n` +
    `Rating: ${feedback.rating}/5\n` +
    `Notes: ${feedback.notes}\n` +
    buildConstraintsBlock(settings) +
    `\nAdapt the schedule based on this feedback. Return JSON only.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: ADAPT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const block = response.content[0]
  if (!block || block.type !== 'text') {
    throw new Error('Anthropic returned no text content for adaptSchedule')
  }

  const cleaned = stripCodeFences(block.text)
  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(
      `adaptSchedule: failed to parse Anthropic response as JSON. ` +
        `Preview: ${cleaned.substring(0, 300)}`
    )
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('goalId' in parsed) ||
    !('tasks' in parsed) ||
    !Array.isArray((parsed as Record<string, unknown>)['tasks']) ||
    !('changesExplained' in parsed)
  ) {
    throw new Error(
      'adaptSchedule: Anthropic response is missing required fields ' +
        '"goalId", "tasks" array, and/or "changesExplained"'
    )
  }

  return parsed as AdaptedSchedule
}
