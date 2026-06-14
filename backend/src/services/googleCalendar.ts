import { google } from 'googleapis'
import type { Task } from '../models/types'

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env['GOOGLE_CLIENT_ID'],
    process.env['GOOGLE_CLIENT_SECRET'],
    process.env['GOOGLE_REDIRECT_URI']
  )
}

export function getAuthUrl(state?: string): string {
  const client = getOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    ...(state !== undefined ? { state } : {}),
  })
}

export async function exchangeCode(
  code: string
): Promise<{ access_token: string; refresh_token: string }> {
  const client = getOAuthClient()
  const { tokens } = await client.getToken(code)

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error(
      'Google OAuth token exchange did not return both access_token and refresh_token. ' +
        'Ensure prompt: "consent" is set so a refresh_token is issued.'
    )
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  }
}

function buildCalendarClient(accessToken: string, refreshToken: string) {
  const auth = getOAuthClient()
  auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken })
  return google.calendar({ version: 'v3', auth })
}

function buildEventBody(task: Task) {
  return {
    summary: task.title,
    description: `${task.description}\n\nSteps:\n${task.stepInstructions.join('\n')}`,
    start: { date: task.scheduledDate },
    end: { date: task.scheduledDate },
  }
}

export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  task: Task
): Promise<string> {
  const calendar = buildCalendarClient(accessToken, refreshToken)

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: buildEventBody(task),
  })

  const eventId = response.data.id
  if (!eventId) {
    throw new Error(
      `Google Calendar created an event for task "${task.title}" but returned no event ID`
    )
  }

  return eventId
}

export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string
): Promise<void> {
  const calendar = buildCalendarClient(accessToken, refreshToken)

  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  })
}

export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  task: Task
): Promise<void> {
  const calendar = buildCalendarClient(accessToken, refreshToken)

  await calendar.events.update({
    calendarId: 'primary',
    eventId,
    requestBody: buildEventBody(task),
  })
}
