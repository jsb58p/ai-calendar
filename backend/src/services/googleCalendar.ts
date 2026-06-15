import { google } from 'googleapis'
import axios from 'axios'
import type { Task } from '../models/types'

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env['GOOGLE_CLIENT_ID'],
    process.env['GOOGLE_CLIENT_SECRET'],
    process.env['GOOGLE_REDIRECT_URI']
  )
}

export function getAuthOAuthClient() {
  return new google.auth.OAuth2(
    process.env['GOOGLE_CLIENT_ID'],
    process.env['GOOGLE_CLIENT_SECRET'],
    process.env['GOOGLE_AUTH_REDIRECT_URI']
  )
}

export function getGoogleAuthUrl(): string {
  const client = getAuthOAuthClient()
  return client.generateAuthUrl({
    access_type: 'online',
    prompt: 'select_account',
    scope: ['openid', 'email', 'profile'],
  })
}

export async function getGoogleUserInfo(
  code: string
): Promise<{ googleId: string; email: string; displayName: string }> {
  const client = getAuthOAuthClient()
  const { tokens } = await client.getToken(code)

  if (!tokens.access_token) {
    throw new Error('Google Sign-In token exchange did not return an access token')
  }

  const { data } = await axios.get<{ sub: string; email: string; name: string }>(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  )

  return { googleId: data.sub, email: data.email, displayName: data.name }
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

function nextDay(dateStr: string): string {
  const d = new Date(dateStr)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

function buildEventBody(task: Task) {
  return {
    summary: task.title,
    description: `${task.description}\n\nSteps:\n${task.stepInstructions.join('\n')}`,
    start: { date: task.scheduledDate },
    end: { date: nextDay(task.scheduledDate) },
  }
}

export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  task: Task
): Promise<string> {
  const calendar = buildCalendarClient(accessToken, refreshToken)

  let response
  try {
    response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: buildEventBody(task),
    })
  } catch (err) {
    console.error('Google Calendar createCalendarEvent error:', err)
    throw err
  }

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
