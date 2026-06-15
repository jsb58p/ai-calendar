# Architecture

## Overview

SchedulerAI is a full-stack AI-powered scheduling application. It follows a three-layer architecture: a React frontend served from Vercel, an Express backend running on Render, and Claude as the AI reasoning layer. MongoDB Atlas persists all application state; Google Calendar provides optional event sync via OAuth 2.0.

---

## System Architecture Diagram

```mermaid
graph TD
  User["👤 User (Browser)"]
  Vercel["Vercel CDN\nReact + Vite\nschedulerai-frontend-eta.vercel.app"]
  Render["Render\nNode.js + Express\nschedulerai-backend.onrender.com"]
  Anthropic["Anthropic API\nclaude-sonnet-4-6\nGoal decomposition\nAdaptive rescheduling"]
  MongoDB["MongoDB Atlas\nFree M0 Cluster\nGoals, Schedules,\nFeedback, Settings"]
  Google["Google Calendar API\nOAuth 2.0\nAll-day event sync"]

  User -->|"HTTPS"| Vercel
  Vercel -->|"REST API calls\nHTTPS"| Render
  Render -->|"Claude API\nJSON prompts"| Anthropic
  Render -->|"MongoDB driver\nTLS"| MongoDB
  Render -->|"googleapis SDK\nOAuth tokens"| Google
  Anthropic -->|"Structured JSON\nschedule response"| Render
  Google -->|"Event IDs"| Render
```

---

## Request Flow — Goal Submission

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend (Vercel)
  participant BE as Backend (Render)
  participant AI as Claude API
  participant DB as MongoDB

  U->>FE: Fill goal form + settings
  FE->>BE: POST /api/goals { title, description, targetDate, settings }
  BE->>DB: saveGoal(goalInput)
  BE->>AI: generateSchedule(goal, settings)
  Note over AI: Builds constraint prompt<br/>from UserSettings<br/>(days, hours, duration, etc.)
  AI-->>BE: Schedule JSON (8-12 tasks with stepInstructions)
  BE->>DB: saveSchedule(schedule)
  BE-->>FE: 201 { goal, schedule }
  FE->>FE: Update Zustand store<br/>Render CalendarGrid
```

---

## Request Flow — Feedback & Adaptation

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant BE as Backend
  participant AI as Claude API
  participant DB as MongoDB

  U->>FE: Rate schedule 1-5 stars + notes
  FE->>BE: POST /api/feedback { scheduleId, rating, notes }
  BE->>DB: getSchedule(scheduleId)
  BE->>AI: adaptSchedule(schedule, feedback, settings)
  Note over AI: Keeps completed/skipped tasks<br/>Only reschedules pending tasks<br/>Explains changes in changesExplained
  AI-->>BE: AdaptedSchedule JSON
  BE->>DB: saveSchedule(adapted)
  BE->>DB: saveFeedback(entry)
  BE-->>FE: 200 { adapted, changesExplained }
  FE->>FE: Update store<br/>Show diff toast<br/>Re-render calendar
```

---

## Request Flow — Google Calendar Sync

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant BE as Backend
  participant G as Google OAuth
  participant GCal as Google Calendar API
  participant DB as MongoDB

  U->>FE: Click "Connect Google Calendar"
  FE->>BE: GET /api/auth/google
  BE-->>FE: Redirect to Google consent URL
  FE->>G: User grants calendar.events scope
  G-->>BE: GET /api/auth/google/callback?code=xxx
  BE->>G: Exchange code for tokens
  G-->>BE: { access_token, refresh_token }
  BE-->>FE: Redirect with tokens in URL params
  FE->>FE: Store tokens in Zustand + localStorage
  FE->>BE: POST /api/calendar/sync-all { goalId, access_token, refresh_token }
  BE->>DB: getSchedule(goalId)
  loop For each task
    BE->>GCal: calendar.events.insert(allDayEvent)
    GCal-->>BE: { id: eventId }
    BE->>DB: Update task.googleCalendarEventId
  end
  BE-->>FE: 200 { synced: N }
```

---

## Frontend Architecture

### Component Tree

```
App (root)
├── ErrorBoundary
├── Header
│   └── Buttons: Settings, History, Give Feedback, Connect Calendar, Change Goal
├── ProgressBar
├── CalendarGrid
│   └── TaskCard (× N per day cell)
├── TaskDetail (modal, conditional)
├── FeedbackModal (modal, conditional)
│   ├── StarRating
│   ├── ScheduleChanges
│   └── FeedbackHistory
├── SettingsPanel (modal, conditional)
├── HistoryPanel (modal, conditional)
├── GoogleConnectPrompt (modal, conditional)
├── Toast (conditional)
└── CalendarSkeleton (loading state)
```

### State Management

State is managed by a single Zustand store (`useAppStore`). No prop drilling — all components subscribe to store slices directly. Relevant state is persisted to `localStorage` on every mutation so the app survives page refreshes without re-fetching from the API.

Key store slices:
- `activeGoalId` / `goals` / `schedules` — goal and schedule data
- `selectedTaskId` — which task's detail modal is open
- `googleTokens` — OAuth tokens for Google Calendar
- `settings` — per-goal scheduling preferences
- `toast` — transient notification state

---

## Backend Architecture

### Route Structure

```
POST   /api/goals                          — Submit goal, generate AI schedule
GET    /api/goals                          — List all goals
GET    /api/goals/:id/schedule             — Get schedule for a goal
PATCH  /api/goals/:goalId/tasks/:taskId    — Update task status
PATCH  /api/goals/:goalId/tasks/:taskId/steps — Update completed steps
POST   /api/feedback                       — Submit feedback, adapt schedule
GET    /api/auth/google                    — Initiate Google OAuth
GET    /api/auth/google/callback           — Handle OAuth callback
POST   /api/calendar/sync                  — Sync single task to Google Calendar
POST   /api/calendar/sync-all             — Sync all tasks for a goal
```

### Service Layer

- `services/db.ts` — MongoDB wrapper; all database reads/writes go through named functions (`saveGoal`, `getSchedule`, `saveFeedback`, etc.). No route handler touches the MongoDB driver directly.
- `services/anthropic.ts` — Claude API client; exports `generateSchedule` and `adaptSchedule`. Handles prompt construction, JSON fence stripping, and response parsing.
- `services/googleCalendar.ts` — Google Calendar API client; exports `getAuthUrl`, `exchangeCode`, `insertEvent`, and `updateEvent`.

---

## Database Schema

### `goals` collection
```json
{
  "id": "uuid-v4",
  "title": "string",
  "description": "string",
  "targetDate": "YYYY-MM-DD",
  "createdAt": "ISO 8601 timestamp"
}
```
Index: `{ id: 1 }` unique

### `schedules` collection
```json
{
  "goalId": "uuid-v4",
  "tasks": [
    {
      "id": "uuid-v4",
      "goalId": "uuid-v4",
      "title": "string",
      "description": "string",
      "scheduledDate": "YYYY-MM-DD",
      "estimatedMinutes": "number",
      "status": "pending | complete | skipped",
      "stepInstructions": ["markdown string"],
      "completedSteps": [0, 2],
      "googleCalendarEventId": "string | undefined"
    }
  ]
}
```
Index: `{ goalId: 1 }` unique

### `feedback` collection
```json
{
  "id": "uuid-v4",
  "scheduleId": "uuid-v4 (= goalId)",
  "rating": "1-5",
  "notes": "string",
  "createdAt": "ISO 8601 timestamp"
}
```
Index: `{ scheduleId: 1 }`

### `settings` collection
```json
{
  "goalId": "uuid-v4",
  "availableDays": [1, 2, 3, 4, 5],
  "dailyStartTime": "HH:MM",
  "dailyEndTime": "HH:MM",
  "minTaskDuration": "number (minutes)",
  "maxTaskDuration": "number (minutes)",
  "difficultyRamp": "gradual | steep | flat",
  "weeklyReviewDay": "0-6",
  "blackoutDates": ["YYYY-MM-DD"],
  "timezone": "IANA timezone string"
}
```

---

## AI Prompt Architecture

### Goal → Schedule Prompt

Takes `GoalInput` + `UserSettings`. Constructs a HARD REQUIREMENTS block containing:
- Available days of the week
- Daily time window (start/end)
- Min/max task duration bounds
- Difficulty ramp preference (`gradual`, `steep`, or `flat`)
- Blackout dates to skip

Claude returns structured JSON with 8–12 tasks. Each task includes a `stepInstructions` array of 3–7 markdown-formatted strings covering exactly how to complete that session.

### Feedback → Adaptation Prompt

Takes the current `Schedule` + `FeedbackEntry` + `UserSettings`. Instructs Claude to:
- Preserve all `complete` and `skipped` tasks exactly as-is
- Only reschedule `pending` tasks
- Return a `changesExplained` string summarising what changed and why, in plain English

### JSON Fence Stripping

Both prompts post-process the raw API response with:
```typescript
response.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
```
This handles cases where Claude wraps its JSON output in ` ```json ``` ` fences.
