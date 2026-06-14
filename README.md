# Calendr.ai

AI-powered calendar app that turns vague goals into actionable, adaptive schedules.

## What it does

You describe a goal and a target date, and Claude generates a day-by-day task schedule to get you there. As you work through it, you rate how the schedule is going and leave notes; Claude then reshapes the remaining tasks based on your feedback. Completed tasks can be synced to Google Calendar so your schedule lives where you already work.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Frontend build | Vite |
| Styling | Tailwind CSS v4 |
| State management | Zustand |
| Backend | Node.js + Express |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Persistence | LowDB (file-based JSON) |
| Calendar sync | Google Calendar API (OAuth 2.0) |
| Testing | Vitest + Playwright |

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com) → Settings → API Keys)
- A Google Cloud project with Calendar API enabled and OAuth 2.0 credentials (for Google Calendar sync — optional)

## Quickstart

```bash
git clone <repo-url>
cd ai-calendar

# Create backend environment file
cat > backend/.env << 'EOF'
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
PORT=3001
EOF

# Start the backend (terminal 1)
cd backend && npm install && npm run dev

# Start the frontend (terminal 2)
cd frontend && npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment Variables

Create `backend/.env` with these values:

| Variable | Description | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Authenticates requests to the Claude API | [console.anthropic.com](https://console.anthropic.com) → Settings → API Keys |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID for Google Calendar sync | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret | Same credentials page as above |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | Set to `http://localhost:3001/api/auth/google/callback` |
| `PORT` | Port the backend listens on | Set to `3001` (must match frontend's API base URL) |

## Running Tests

```bash
# Backend unit tests (25 tests)
cd backend && npm test

# Frontend unit tests with coverage (157 tests, enforces 80% threshold)
cd frontend && npm run test:coverage

# End-to-end tests with Playwright (8 tests, requires both servers running)
cd ai-calendar && npx playwright test
```

GitHub Actions runs all three suites automatically on every push and pull request to `main`.

## Project Structure

```
ai-calendar/
├── backend/
│   └── src/
│       ├── index.ts                  # Express app entry point
│       ├── middleware/
│       │   └── errorHandler.ts
│       ├── models/
│       │   └── types.ts              # Shared TypeScript types
│       ├── routes/
│       │   ├── auth.ts               # Google OAuth endpoints
│       │   ├── calendar.ts           # Google Calendar sync
│       │   ├── feedback.ts           # POST /api/feedback
│       │   └── goals.ts              # CRUD + schedule generation
│       ├── services/
│       │   ├── anthropic.ts          # Claude API — schedule generation & adaptation
│       │   ├── db.ts                 # LowDB wrapper
│       │   └── googleCalendar.ts     # Google Calendar API client
│       └── test/
│           ├── anthropic.test.ts
│           ├── db.test.ts
│           ├── feedback.route.test.ts
│           ├── goals.route.test.ts
│           └── smoke.test.ts
├── frontend/
│   └── src/
│       ├── App.tsx                   # Root component, routing, rehydration
│       ├── api/
│       │   └── client.ts             # Axios API client
│       ├── components/
│       │   ├── Calendar/
│       │   │   ├── CalendarGrid.tsx  # Monthly calendar view
│       │   │   ├── CalendarSkeleton.tsx
│       │   │   └── ProgressBar.tsx
│       │   ├── FeedbackModal/
│       │   │   ├── FeedbackModal.tsx # Star rating + notes form
│       │   │   ├── FeedbackHistory.tsx
│       │   │   ├── HistoryPanel.tsx
│       │   │   ├── ScheduleChanges.tsx
│       │   │   └── StarRating.tsx
│       │   ├── GoalInput/
│       │   │   └── GoalInput.tsx     # Goal submission form
│       │   ├── TaskCard/
│       │   │   ├── TaskCard.tsx
│       │   │   └── TaskDetail.tsx    # Side panel with step instructions
│       │   ├── ErrorBoundary.tsx
│       │   ├── Header.tsx
│       │   ├── Skeleton.tsx
│       │   └── Toast.tsx
│       ├── hooks/
│       ├── store/
│       │   └── useAppStore.ts        # Zustand store
│       ├── test/                     # Vitest unit + integration tests
│       ├── types/
│       │   └── index.ts
│       └── utils/
│           ├── calendar.ts           # Date helpers
│           └── diff.ts               # Schedule comparison for toast diffs
├── tests/                            # Playwright E2E tests
│   ├── fixtures/
│   │   ├── mockFeedbackData.ts
│   │   └── mockSchedule.ts
│   ├── feedback.spec.ts
│   ├── happy-path.spec.ts
│   └── validation.spec.ts
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI
└── playwright.config.ts
```

## Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create a new project (or select an existing one).
2. Navigate to **APIs & Services → Library** and enable the **Google Calendar API**.
3. Go to **APIs & Services → Credentials** and click **Create Credentials → OAuth 2.0 Client ID**.
4. Set application type to **Web application**.
5. Under **Authorized redirect URIs**, add: `http://localhost:3001/api/auth/google/callback`
6. Click **Create** and copy the **Client ID** and **Client Secret**.
7. Paste them into `backend/.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
8. In the app, click the **Sync to Google Calendar** button on any task to start the OAuth flow.
