# API Reference

## Base URL

| Environment | URL |
|---|---|
| Production | `https://schedulerai-backend.onrender.com` |
| Development | `http://localhost:3001` |

All paths below are relative to the base URL.

---

## Authentication

Goal, schedule, and feedback endpoints require no authentication. Google Calendar endpoints require OAuth tokens in the request body — obtain them by completing the OAuth flow described under [Auth endpoints](#auth).

---

## Error Format

All errors return HTTP 4xx/5xx with a JSON body:

```json
{ "error": "descriptive message string" }
```

---

## Endpoints

### Goals

---

#### `POST /api/goals`

Submit a new goal. The backend persists the goal, calls Claude to generate a day-by-day schedule, and returns both.

**Request body**

```json
{
  "title": "string (required)",
  "description": "string (required)",
  "targetDate": "YYYY-MM-DD (required)",
  "settings": {
    "availableDays": [1, 2, 3, 4, 5],
    "dailyStartTime": "09:00",
    "dailyEndTime": "17:00",
    "minTaskDuration": 30,
    "maxTaskDuration": 120,
    "difficultyRamp": "gradual | steep | flat",
    "weeklyReviewDay": 0,
    "blackoutDates": [],
    "timezone": "America/Chicago"
  }
}
```

**Response — 201 Created**

```json
{
  "goal": {
    "id": "uuid-v4",
    "title": "string",
    "description": "string",
    "targetDate": "YYYY-MM-DD",
    "createdAt": "ISO 8601"
  },
  "schedule": {
    "goalId": "uuid-v4",
    "tasks": [
      {
        "id": "uuid-v4",
        "goalId": "uuid-v4",
        "title": "string",
        "description": "string",
        "scheduledDate": "YYYY-MM-DD",
        "estimatedMinutes": 60,
        "status": "pending",
        "stepInstructions": ["markdown string"],
        "completedSteps": [],
        "googleCalendarEventId": ""
      }
    ]
  }
}
```

**Errors**

| Status | Condition |
|---|---|
| 400 | Missing required field (`title`, `description`, or `targetDate`) |
| 500 | Claude API failure or JSON parse error |

**Example**

```bash
curl -X POST https://schedulerai-backend.onrender.com/api/goals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn fingerpicking guitar",
    "description": "Go from zero to playing Blackbird by The Beatles",
    "targetDate": "2026-09-01",
    "settings": {
      "availableDays": [1,2,3,4,5],
      "dailyStartTime": "18:00",
      "dailyEndTime": "20:00",
      "minTaskDuration": 30,
      "maxTaskDuration": 60,
      "difficultyRamp": "gradual",
      "weeklyReviewDay": 0,
      "blackoutDates": [],
      "timezone": "America/Chicago"
    }
  }'
```

---

#### `GET /api/goals`

List all goals stored in the database.

**Response — 200 OK**

```json
{
  "goals": [
    {
      "id": "uuid-v4",
      "title": "string",
      "description": "string",
      "targetDate": "YYYY-MM-DD",
      "createdAt": "ISO 8601"
    }
  ]
}
```

**Errors**

| Status | Condition |
|---|---|
| 500 | Database read failure |

**Example**

```bash
curl https://schedulerai-backend.onrender.com/api/goals
```

---

#### `GET /api/goals/:id/schedule`

Retrieve the current schedule for a goal.

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | string | Goal UUID |

**Response — 200 OK**

```json
{
  "goalId": "uuid-v4",
  "tasks": [ /* Task objects — see POST /api/goals response */ ]
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | No schedule found for the given goal ID |
| 500 | Database read failure |

**Example**

```bash
curl https://schedulerai-backend.onrender.com/api/goals/abc-123/schedule
```

---

#### `PATCH /api/goals/:goalId/tasks/:taskId`

Update the status of a single task.

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `goalId` | string | Goal UUID |
| `taskId` | string | Task UUID |

**Request body**

```json
{ "status": "pending | complete | skipped" }
```

**Response — 200 OK**

The updated task object.

```json
{
  "id": "uuid-v4",
  "status": "complete"
}
```

**Errors**

| Status | Condition |
|---|---|
| 400 | Invalid status value |
| 404 | Schedule or task not found |
| 500 | Database write failure |

**Example**

```bash
curl -X PATCH https://schedulerai-backend.onrender.com/api/goals/abc-123/tasks/task-456 \
  -H "Content-Type: application/json" \
  -d '{ "status": "complete" }'
```

---

#### `PATCH /api/goals/:goalId/tasks/:taskId/steps`

Update the set of completed step indices for a task.

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `goalId` | string | Goal UUID |
| `taskId` | string | Task UUID |

**Request body**

```json
{ "completedSteps": [0, 2, 3] }
```

**Response — 200 OK**

```json
{ "completedSteps": [0, 2, 3] }
```

**Errors**

| Status | Condition |
|---|---|
| 400 | `completedSteps` not an array |
| 404 | Schedule or task not found |
| 500 | Database write failure |

**Example**

```bash
curl -X PATCH https://schedulerai-backend.onrender.com/api/goals/abc-123/tasks/task-456/steps \
  -H "Content-Type: application/json" \
  -d '{ "completedSteps": [0, 1] }'
```

---

### Feedback

---

#### `POST /api/feedback`

Submit user feedback for a schedule. The backend calls Claude to adapt remaining tasks, persists the new schedule, records the feedback entry, and returns both the adapted schedule and an explanation of changes.

**Request body**

```json
{
  "scheduleId": "uuid-v4 (= goalId)",
  "rating": 4,
  "notes": "Tasks are a bit too long, can we shorten them?"
}
```

| Field | Type | Description |
|---|---|---|
| `scheduleId` | string | The goal ID whose schedule to adapt |
| `rating` | number | Integer 1–5 |
| `notes` | string | Free-text feedback |

**Response — 200 OK**

```json
{
  "adapted": { /* Schedule object */ },
  "changesExplained": "Shortened all remaining tasks from 90 min to 45 min and spread them across more days to reduce daily load."
}
```

**Errors**

| Status | Condition |
|---|---|
| 400 | Missing `scheduleId`, `rating`, or `notes`; invalid rating |
| 404 | No schedule found for `scheduleId` |
| 500 | Claude API failure or database write failure |

**Example**

```bash
curl -X POST https://schedulerai-backend.onrender.com/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "scheduleId": "abc-123",
    "rating": 2,
    "notes": "Way too many tasks per day, I can only do one per day"
  }'
```

---

### Auth

---

#### `GET /api/auth/google`

Initiate the Google OAuth 2.0 flow. The server redirects the browser to Google's consent screen.

**Response — 302 Redirect**

Redirects to `https://accounts.google.com/o/oauth2/auth?...` with the `calendar.events` scope.

**Example**

```bash
# Open in browser — do not call with curl
open https://schedulerai-backend.onrender.com/api/auth/google
```

---

#### `GET /api/auth/google/callback`

OAuth callback handler. Exchanges the authorization code for tokens and redirects back to the frontend with tokens in query params.

**Query parameters** (set by Google, not the client)

| Parameter | Description |
|---|---|
| `code` | Authorization code from Google |

**Response — 302 Redirect**

Redirects to `${FRONTEND_URL}?access_token=...&refresh_token=...`

**Errors**

| Status | Condition |
|---|---|
| 400 | No `code` query parameter |
| 500 | Token exchange failure |

---

### Calendar

---

#### `POST /api/calendar/sync`

Sync a single task to Google Calendar as an all-day event.

**Request body**

```json
{
  "taskId": "uuid-v4",
  "access_token": "string",
  "refresh_token": "string"
}
```

**Response — 200 OK**

```json
{ "eventId": "google-calendar-event-id" }
```

**Errors**

| Status | Condition |
|---|---|
| 400 | Missing `taskId` or tokens |
| 404 | Task not found in any schedule |
| 500 | Google Calendar API failure |

**Example**

```bash
curl -X POST https://schedulerai-backend.onrender.com/api/calendar/sync \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-456",
    "access_token": "ya29.xxx",
    "refresh_token": "1//xxx"
  }'
```

---

#### `POST /api/calendar/sync-all`

Sync every task in a goal's schedule to Google Calendar. Tasks that already have a `googleCalendarEventId` are updated; tasks without one are created. Tasks with an empty `googleCalendarEventId` string are skipped.

**Request body**

```json
{
  "goalId": "uuid-v4",
  "access_token": "string",
  "refresh_token": "string"
}
```

**Response — 200 OK**

```json
{ "synced": 8 }
```

**Errors**

| Status | Condition |
|---|---|
| 400 | Missing `goalId` or tokens |
| 404 | No schedule found for `goalId` |
| 500 | Google Calendar API failure on one or more tasks |

**Example**

```bash
curl -X POST https://schedulerai-backend.onrender.com/api/calendar/sync-all \
  -H "Content-Type: application/json" \
  -d '{
    "goalId": "abc-123",
    "access_token": "ya29.xxx",
    "refresh_token": "1//xxx"
  }'
```
