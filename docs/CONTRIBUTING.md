# Contributing

## Development Setup

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/ai-calendar.git
cd ai-calendar

# 2. Install backend dependencies
cd backend && npm install

# 3. Install frontend dependencies
cd ../frontend && npm install

# 4. Create backend/.env (see table below)
```

Create `backend/.env` with the following keys:

| Variable | Description | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Authenticates requests to the Claude API | [console.anthropic.com](https://console.anthropic.com) → Settings → API Keys |
| `MONGODB_URI` | MongoDB Atlas connection string | Atlas dashboard → Connect → Drivers → Node.js |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID for Google Calendar | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret | Same credentials page as `GOOGLE_CLIENT_ID` |
| `GOOGLE_REDIRECT_URI` | Google Calendar OAuth callback URL | Set to `http://localhost:3001/api/auth/google/callback` in dev |
| `JWT_SECRET` | Secret key for signing JWTs | Generate with `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | JWT expiry duration | Set to `7d` |
| `RESEND_API_KEY` | API key for sending transactional emails | [resend.com](https://resend.com) → API Keys |
| `EMAIL_FROM` | Sender address for verification emails | `onboarding@resend.dev` (free tier) or your verified domain |
| `BACKEND_URL` | Backend base URL, used in email links | Set to `http://localhost:3001` in dev |
| `GOOGLE_AUTH_REDIRECT_URI` | Google Sign-In OAuth callback URL | Set to `http://localhost:3001/api/auth/users/google/callback` in dev |

```bash
# 5. Start the backend (terminal 1)
cd backend && npm run dev

# 6. Start the frontend (terminal 2)
cd frontend && npm run dev

# 7. Open the app
open http://localhost:5173
```

---

## Admin Setup

After starting the app locally (or after first deploy to production), promote your own account to admin so you can access the Admin Panel:

```bash
cd backend && npm run make-admin your@email.com
```

This runs `backend/src/scripts/makeAdmin.ts`, which sets `isAdmin: true` on the user document in MongoDB. You must have already registered an account with that email before running the script.

The Admin Panel is then accessible via the purple "Admin" button in the top-right of the header.

---

## Project Structure

```
ai-calendar/
├── backend/
│   ├── src/
│   │   ├── index.ts                   # Express server entry point
│   │   ├── middleware/
│   │   │   ├── auth.ts                # requireAuth + requireAdmin middleware
│   │   │   └── errorHandler.ts        # Global error handler
│   │   ├── models/
│   │   │   └── types.ts               # All TypeScript interfaces
│   │   ├── routes/
│   │   │   ├── admin.ts               # Admin user management endpoints
│   │   │   ├── auth.ts                # Google Calendar OAuth endpoints
│   │   │   ├── auth-users.ts          # User auth endpoints (register/login/me/etc.)
│   │   │   ├── calendar.ts            # Google Calendar sync
│   │   │   ├── feedback.ts            # Feedback + rescheduling
│   │   │   └── goals.ts               # Goal + schedule CRUD
│   │   ├── scripts/
│   │   │   └── makeAdmin.ts           # CLI script to grant admin status
│   │   ├── services/
│   │   │   ├── anthropic.ts           # Claude API integration
│   │   │   ├── db.ts                  # MongoDB service layer
│   │   │   ├── email.ts               # Resend email service
│   │   │   └── googleCalendar.ts      # Google Calendar API
│   │   └── test/                      # Backend unit tests (Vitest)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # Root component + routing logic
│   │   ├── api/
│   │   │   └── client.ts              # Axios API client (+ Bearer interceptor)
│   │   ├── components/
│   │   │   ├── Admin/
│   │   │   │   └── AdminPanel.tsx     # Admin user management modal
│   │   │   ├── Auth/
│   │   │   │   ├── LoginPage.tsx      # Login/register form (shown when !isAuthenticated)
│   │   │   │   └── EmailVerified.tsx  # Confirmation page at /verified route
│   │   │   ├── Calendar/              # CalendarGrid, ProgressBar, Skeleton
│   │   │   ├── FeedbackModal/         # FeedbackModal, History, StarRating, etc.
│   │   │   ├── GoalInput/             # Goal submission form
│   │   │   ├── GoalSwitcher/
│   │   │   │   ├── GoalSwitcher.tsx   # Multi-goal management modal
│   │   │   │   └── GoalCard.tsx       # Individual goal card in the switcher
│   │   │   ├── Settings/              # SettingsPanel
│   │   │   ├── TaskCard/              # TaskCard chip + TaskDetail modal
│   │   │   └── ui/                    # Reusable primitives (Button, Input, Modal, etc.)
│   │   ├── store/
│   │   │   └── useAppStore.ts         # Zustand global state
│   │   ├── test/                      # Frontend unit + integration tests
│   │   ├── types/
│   │   │   └── index.ts               # Shared TypeScript types
│   │   └── utils/
│   │       ├── calendar.ts            # Date utility functions
│   │       └── diff.ts                # Schedule diff computation
│   ├── package.json
│   └── vite.config.ts
├── tests/                             # Playwright E2E tests
├── docs/                              # This documentation
├── render.yaml                        # Render deployment config
└── README.md
```

---

## Running Tests

```bash
# Backend unit tests
cd backend && npm test

# Frontend unit tests (no coverage threshold)
cd frontend && npm run test -- --run

# Frontend with coverage (enforces 80% threshold on lines/functions/branches)
cd frontend && npm run test:coverage

# E2E tests (requires both dev servers running)
npx playwright test

# All suites in sequence
cd backend && npm test
cd ../frontend && npm run test -- --run
cd .. && npx playwright test
```

---

## Code Style

- **TypeScript strict mode** — `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters` are all on. Never use `any` without an explicit cast comment explaining why.
- **`data-testid` on all interactive elements** — every button, input, and meaningful container needs a `data-testid` attribute so Playwright and Vitest can target it without brittle CSS selectors.
- **Inline styles alongside Tailwind** — Tailwind v4 custom tokens (e.g. `bg-bg-surface`, `text-text-primary`) don't always resolve reliably in all rendering contexts. Use `className` for spacing and layout where Tailwind utilities are reliable; use `style={{ }}` for design-token values (colours, specific padding) where they are not. See [DECISIONS.md](./DECISIONS.md#4-inline-styles-alongside-tailwind) for full context.
- **AI service functions strip JSON fences** — always call `.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')` on the raw Claude response before `JSON.parse()`.
- **Store actions persist to `localStorage`** — any store mutation that affects state the user should see on page refresh (active goal, tokens, settings) must also write to `localStorage`.
- **All DB queries scoped by userId** — route handlers must never query goals, schedules, feedback, or settings without also filtering by `req.user!.userId`. Use the named helper functions in `db.ts`; do not call `getDb()` directly from route files.

---

## Making Changes

**New components**
- Add `data-testid` on every interactive element and every meaningful container.
- Create a corresponding test file in `frontend/src/test/`.

**New API endpoints**
- Add a route handler in the appropriate file under `backend/src/routes/`.
- Protect user-scoped routes with `requireAuth` and admin routes with `requireAuth, requireAdmin`.
- Add a unit test in `backend/src/test/`.
- Update [docs/API.md](./API.md) with the new endpoint documentation.

**Database changes**
- Add or update the named helper function in `backend/src/services/db.ts` — route handlers must not use `getDb()` directly.
- Update the schema section in [docs/ARCHITECTURE.md](./ARCHITECTURE.md#database-schema).

**Before pushing**
- Run the full test suite (all three commands above) — CI will reject the PR if any suite fails.
- Never commit `.env` files or any file containing secrets.
- Update the relevant `docs/` file if your change affects documented behaviour.
