# API Reference

## Base URL

| Environment | URL |
|---|---|
| Production | `https://schedulerai-backend.onrender.com` |
| Development | `http://localhost:3001` |

All paths below are relative to the base URL.

---

## Authentication

Most endpoints require a JWT sent as a Bearer token:

```
Authorization: Bearer <token>
```

**Obtaining a token:** Call `POST /api/auth/users/register` or `POST /api/auth/users/login`. The token is in `response.body.token`. The frontend stores it in `localStorage` and an axios request interceptor attaches it to every outgoing request automatically.

**Admin endpoints** additionally require `isAdmin: true` on the user account. Admin status is granted via the `make-admin` script (see [CONTRIBUTING.md](./CONTRIBUTING.md#admin-setup)).

**Public endpoints** (no token required):
- `POST /api/auth/users/register`
- `POST /api/auth/users/login`
- `GET /api/auth/users/verify-email`
- `GET /api/auth/users/google` and `/api/auth/users/google/callback` (Google Sign-In)
- `GET /api/auth/google` and `/api/auth/google/callback` (Google Calendar OAuth)

---

## Error Format

All errors return HTTP 4xx/5xx with a JSON body:

```json
{ "error": "descriptive message string" }
```

---

## Endpoints

### User Auth

---

#### `POST /api/auth/users/register`

Create a new account with email and password. Sends a verification email via Resend. Returns a JWT immediately so the user can start using the app before verifying.

**Request body**

```json
{
  "email": "string (required)",
  "password": "string (required, min 8 characters)",
  "displayName": "string (required)"
}
```

**Response — 201 Created**

```json
{
  "user": {
    "id": "uuid-v4",
    "email": "string",
    "displayName": "string",
    "emailVerified": false
  },
  "token": "jwt-string",
  "message": "Account created. Check your email to verify your address."
}
```

**Errors**

| Status | Condition |
|---|---|
| 400 | Missing `email`, `password`, or `displayName`; password shorter than 8 characters |
| 409 | Email already registered |

**Example**

```bash
curl -X POST https://schedulerai-backend.onrender.com/api/auth/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "securepass",
    "displayName": "Alice"
  }'
```

---

#### `POST /api/auth/users/login`

Sign in with email and password.

**Request body**

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response — 200 OK**

```json
{
  "user": {
    "id": "uuid-v4",
    "email": "string",
    "displayName": "string",
    "emailVerified": true,
    "isAdmin": true
  },
  "token": "jwt-string"
}
```

`isAdmin` is only present if the user has admin status.

**Errors**

| Status | Condition |
|---|---|
| 400 | Account was created via Google Sign-In (no password set) |
| 401 | Wrong email or password |

**Example**

```bash
curl -X POST https://schedulerai-backend.onrender.com/api/auth/users/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "alice@example.com", "password": "securepass" }'
```

---

#### `POST /api/auth/users/logout`

**Requires auth.** Clears the `auth_token` session cookie. The frontend also removes `auth_token` from `localStorage`.

**Response — 200 OK**

```json
{ "message": "Logged out" }
```

**Example**

```bash
curl -X POST https://schedulerai-backend.onrender.com/api/auth/users/logout \
  -H "Authorization: Bearer <token>"
```

---

#### `GET /api/auth/users/me`

**Requires auth.** Returns the current user's profile.

**Response — 200 OK**

```json
{
  "user": {
    "id": "uuid-v4",
    "email": "string",
    "displayName": "string",
    "emailVerified": true,
    "isAdmin": true
  }
}
```

**Errors**

| Status | Condition |
|---|---|
| 401 | Missing or invalid token |
| 403 | Account suspended |

**Example**

```bash
curl https://schedulerai-backend.onrender.com/api/auth/users/me \
  -H "Authorization: Bearer <token>"
```

---

#### `GET /api/auth/users/verify-email`

Verify an email address using the token sent in the registration email. Called by clicking the link in the verification email — not by the frontend JS directly.

**Query parameters**

| Parameter | Description |
|---|---|
| `token` | Verification token from the email link |

**Response — 302 Redirect**

Redirects to `${FRONTEND_URL}/verified` on success.

**Errors**

| Status | Condition |
|---|---|
| 400 | Token missing, not found, or already used |

---

#### `POST /api/auth/users/resend-verification`

**Requires auth.** Re-sends the verification email to the current user.

**Response — 200 OK**

```json
{ "message": "Verification email sent" }
```

**Example**

```bash
curl -X POST https://schedulerai-backend.onrender.com/api/auth/users/resend-verification \
  -H "Authorization: Bearer <token>"
```

---

#### `GET /api/auth/users/google`

Initiate Google Sign-In. Redirects the browser to Google's consent screen. On success, Google redirects to `/api/auth/users/google/callback`, which issues a JWT and redirects to `${FRONTEND_URL}?auth_token=<jwt>`. The frontend stores this token in `localStorage`.

**Response — 302 Redirect**

Redirects to `https://accounts.google.com/o/oauth2/auth?...`

**Example**

```bash
# Open in browser — do not call with curl
open https://schedulerai-backend.onrender.com/api/auth/users/google
```

---

#### `GET /api/auth/users/google/callback`

OAuth callback handler for Google Sign-In. Exchanges the authorization code for user info, creates or retrieves the user account, issues a JWT, and redirects to the frontend.

**Query parameters** (set by Google, not the client)

| Parameter | Description |
|---|---|
| `code` | Authorization code from Google |

**Response — 302 Redirect**

Redirects to `${FRONTEND_URL}?auth_token=<jwt>`

---

### Goals

All goals endpoints require `Authorization: Bearer <token>`. Goals are scoped to the authenticated user — each user sees only their own goals.

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
| 401 | Missing or invalid token |
| 500 | Claude API failure or JSON parse error |

**Example**

```bash
curl -X POST https://schedulerai-backend.onrender.com/api/goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
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

List all goals for the current user.

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
| 401 | Missing or invalid token |
| 500 | Database read failure |

**Example**

```bash
curl https://schedulerai-backend.onrender.com/api/goals \
  -H "Authorization: Bearer <token>"
```

---

#### `GET /api/goals/:id/schedule`

Retrieve the current schedule for a goal (must belong to the current user).

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
| 401 | Missing or invalid token |
| 404 | No schedule found for the given goal ID, or goal belongs to another user |
| 500 | Database read failure |

**Example**

```bash
curl https://schedulerai-backend.onrender.com/api/goals/abc-123/schedule \
  -H "Authorization: Bearer <token>"
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

```json
{ "id": "uuid-v4", "status": "complete" }
```

**Errors**

| Status | Condition |
|---|---|
| 400 | Invalid status value |
| 401 | Missing or invalid token |
| 404 | Schedule or task not found, or belongs to another user |
| 500 | Database write failure |

**Example**

```bash
curl -X PATCH https://schedulerai-backend.onrender.com/api/goals/abc-123/tasks/task-456 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
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
| 401 | Missing or invalid token |
| 404 | Schedule or task not found, or belongs to another user |
| 500 | Database write failure |

**Example**

```bash
curl -X PATCH https://schedulerai-backend.onrender.com/api/goals/abc-123/tasks/task-456/steps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{ "completedSteps": [0, 1] }'
```

---

### Feedback

---

#### `POST /api/feedback`

**Requires auth.** Submit user feedback for a schedule. The backend calls Claude to adapt remaining tasks, persists the new schedule, records the feedback entry, and returns both the adapted schedule and an explanation of changes.

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
| 401 | Missing or invalid token |
| 404 | No schedule found for `scheduleId`, or belongs to another user |
| 500 | Claude API failure or database write failure |

**Example**

```bash
curl -X POST https://schedulerai-backend.onrender.com/api/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "scheduleId": "abc-123",
    "rating": 2,
    "notes": "Way too many tasks per day, I can only do one per day"
  }'
```

---

### Auth — Google Calendar OAuth

These endpoints handle Google Calendar OAuth (separate from Google Sign-In). They do not require a JWT — the OAuth flow is browser-driven.

---

#### `GET /api/auth/google`

Initiate the Google Calendar OAuth 2.0 flow. Redirects the browser to Google's consent screen requesting the `calendar.events` scope.

**Response — 302 Redirect**

Redirects to `https://accounts.google.com/o/oauth2/auth?...`

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

All calendar endpoints require `Authorization: Bearer <token>`. The schedule is also filtered by `userId` — a user cannot sync another user's tasks.

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
| 401 | Missing or invalid token |
| 404 | Task not found (or belongs to another user) |
| 500 | Google Calendar API failure |

**Example**

```bash
curl -X POST https://schedulerai-backend.onrender.com/api/calendar/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "taskId": "task-456",
    "access_token": "ya29.xxx",
    "refresh_token": "1//xxx"
  }'
```

---

#### `POST /api/calendar/sync-all`

Sync every task in a goal's schedule to Google Calendar. Tasks that already have a `googleCalendarEventId` are skipped; tasks without one are created.

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
| 401 | Missing or invalid token |
| 404 | No schedule found for `goalId` (or belongs to another user) |
| 500 | Google Calendar API failure on one or more tasks |

**Example**

```bash
curl -X POST https://schedulerai-backend.onrender.com/api/calendar/sync-all \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "goalId": "abc-123",
    "access_token": "ya29.xxx",
    "refresh_token": "1//xxx"
  }'
```

---

### Admin

All admin endpoints require `Authorization: Bearer <token>` **and** `isAdmin: true` on the account. Both conditions are enforced server-side — `requireAuth` then `requireAdmin` middleware chain.

---

#### `GET /api/admin/users`

List all user accounts with per-user goal counts.

**Response — 200 OK**

```json
{
  "users": [
    {
      "id": "uuid-v4",
      "email": "string",
      "displayName": "string",
      "emailVerified": true,
      "isAdmin": true,
      "suspended": false,
      "createdAt": "ISO 8601",
      "goalCount": 3
    }
  ]
}
```

Sensitive fields (`passwordHash`, `googleId`, `verificationToken`, `passwordResetToken`) are excluded from the response.

**Errors**

| Status | Condition |
|---|---|
| 401 | Missing or invalid token |
| 403 | Not an admin |

**Example**

```bash
curl https://schedulerai-backend.onrender.com/api/admin/users \
  -H "Authorization: Bearer <admin-token>"
```

---

#### `DELETE /api/admin/users/:userId`

Delete a user account and all associated data (goals, schedules, feedback, settings). Cannot delete your own account.

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `userId` | string | User UUID to delete |

**Response — 200 OK**

```json
{ "message": "User deleted" }
```

**Errors**

| Status | Condition |
|---|---|
| 400 | Attempting to delete your own account |
| 401 | Missing or invalid token |
| 403 | Not an admin |

**Example**

```bash
curl -X DELETE https://schedulerai-backend.onrender.com/api/admin/users/user-123 \
  -H "Authorization: Bearer <admin-token>"
```

---

#### `PATCH /api/admin/users/:userId/suspend`

Toggle a user's `suspended` flag. A suspended user receives a 403 on any authenticated request.

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `userId` | string | User UUID |

**Response — 200 OK**

```json
{
  "user": {
    "id": "uuid-v4",
    "email": "string",
    "displayName": "string",
    "emailVerified": true,
    "suspended": true,
    "createdAt": "ISO 8601",
    "goalCount": 2
  }
}
```

**Errors**

| Status | Condition |
|---|---|
| 401 | Missing or invalid token |
| 403 | Not an admin |
| 404 | User not found |

**Example**

```bash
curl -X PATCH https://schedulerai-backend.onrender.com/api/admin/users/user-123/suspend \
  -H "Authorization: Bearer <admin-token>"
```

---

#### `PATCH /api/admin/users/:userId/reset-password`

Generate a password reset token for a user and send a reset email via Resend.

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `userId` | string | User UUID |

**Response — 200 OK**

```json
{ "message": "Password reset email sent" }
```

**Errors**

| Status | Condition |
|---|---|
| 401 | Missing or invalid token |
| 403 | Not an admin |
| 404 | User not found |

**Example**

```bash
curl -X PATCH https://schedulerai-backend.onrender.com/api/admin/users/user-123/reset-password \
  -H "Authorization: Bearer <admin-token>"
```

---

#### `PATCH /api/admin/users/:userId/toggle-admin`

Toggle a user's `isAdmin` flag. Cannot toggle your own admin status.

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `userId` | string | User UUID |

**Response — 200 OK**

```json
{
  "user": {
    "id": "uuid-v4",
    "email": "string",
    "isAdmin": true,
    "createdAt": "ISO 8601",
    "goalCount": 0
  }
}
```

**Errors**

| Status | Condition |
|---|---|
| 400 | Attempting to toggle your own admin status |
| 401 | Missing or invalid token |
| 403 | Not an admin |
| 404 | User not found |

**Example**

```bash
curl -X PATCH https://schedulerai-backend.onrender.com/api/admin/users/user-123/toggle-admin \
  -H "Authorization: Bearer <admin-token>"
```
