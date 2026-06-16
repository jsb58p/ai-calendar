# SchedulerAI

**Turn any goal into an adaptive, day-by-day schedule — powered by Claude.**

![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tests](https://img.shields.io/badge/tests-313%20passing-brightgreen)
![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black)

---

## Live Demo

**[schedulerai-frontend-eta.vercel.app](https://schedulerai-frontend-eta.vercel.app)**

> The backend runs on Render's free tier and may take 30–60 seconds to wake from idle on first load.

---

## Features

- **AI-generated schedules** — Describe a goal and a target date; Claude builds a realistic day-by-day task plan with step-by-step instructions for each session
- **Adaptive rescheduling** — Rate your schedule and leave notes; Claude reshapes remaining tasks around your feedback without touching completed ones
- **Scheduling constraints** — Configure available days, daily time window, task duration bounds, difficulty ramp, and blackout dates
- **Google Calendar sync** — OAuth 2.0 flow; all tasks sync as all-day events and update in-place on re-sync
- **Goal history** — Switch between past goals and their schedules without losing progress
- **Progress tracking** — Per-task step-by-step completion with checkboxes; task status (complete / pending / skipped)
- **Diff toasts** — When Claude adapts your schedule, a toast explains exactly what changed and why
- **Dark-mode design system** — Custom semantic colour tokens, fully keyboard-accessible
- **User authentication** — Email/password registration and Google Sign-In; JWT sessions via Authorization header
- **Email verification** — Resend sends a verification link on registration; verified badge shown in-app
- **Per-user data isolation** — Each user sees only their own goals, schedules, and feedback
- **Goal switcher** — Manage multiple goals per account from the "My Goals" button
- **Admin panel** — User management: view all accounts, suspend/unsuspend, delete with cascade, trigger password reset, toggle admin status

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Frontend build | Vite |
| Styling | Tailwind CSS v4 |
| State management | Zustand |
| Backend | Node.js + Express |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Database | MongoDB Atlas |
| Auth | JWT + bcryptjs |
| Email | Resend |
| Calendar sync | Google Calendar API (OAuth 2.0) |
| Testing | Vitest + Playwright |
| Frontend deploy | Vercel |
| Backend deploy | Render |

---

## Getting Started

```bash
git clone https://github.com/<your-username>/ai-calendar.git
cd ai-calendar

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Create backend/.env
cat > backend/.env << 'EOF'
ANTHROPIC_API_KEY=your_anthropic_api_key_here
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=schedulerAI
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
GOOGLE_AUTH_REDIRECT_URI=http://localhost:3001/api/auth/users/google/callback
JWT_SECRET=generate-with-openssl-rand-hex-32
JWT_EXPIRES_IN=7d
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=onboarding@resend.dev
BACKEND_URL=http://localhost:3001
PORT=3001
EOF

# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for the full setup guide including MongoDB Atlas, Google Cloud, and Resend setup.

---

## Documentation

| Document | Description |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System diagrams, auth flow, component tree, database schema, AI prompt architecture |
| [docs/API.md](docs/API.md) | Complete REST API reference — auth, goals, feedback, calendar, and admin endpoints |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Development setup, project structure, code style, and contribution guidelines |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production environment variables, deploy process, and known limitations |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Architecture Decision Records — why Zustand, MongoDB, Authorization header, Resend, etc. |

---

## Architecture

Three-layer architecture: React frontend (Vercel) → Express backend (Render) → Claude API + MongoDB Atlas.

```
User (browser)
  └── Vercel CDN (React + Vite)
        └── Render (Node.js + Express)
              ├── Anthropic API  (schedule generation + adaptation)
              ├── MongoDB Atlas  (users, goals, schedules, feedback, settings)
              ├── Google Calendar API  (OAuth 2.0, all-day events)
              └── Resend  (email verification, password reset)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for sequence diagrams covering registration & email verification, goal submission, feedback adaptation, and the full Google Calendar OAuth flow.

---

## Testing

```bash
# Backend unit tests — 57 tests
cd backend && npm test

# Frontend unit tests — 248 tests (enforces 80% coverage threshold)
cd frontend && npm run test:coverage

# E2E tests — 8 tests (requires both dev servers running)
npx playwright test
```

GitHub Actions runs all three suites automatically on every push and pull request to `main`.

---

## Deployment

Both Vercel and Render are connected to this GitHub repository and auto-deploy on every push to `master`. No manual deploy steps needed.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for environment variable setup and known limitations (Render cold starts, Google OAuth testing mode, MongoDB storage cap).

---

## Mobile App

A React Native Android app built with Expo is available in the `mobile/` directory.

```bash
cd mobile && npm install
npx expo start
```

Scan the QR code with **Expo Go** on your Android device.

Create `mobile/.env` with:

```
EXPO_PUBLIC_API_URL=https://schedulerai-backend.onrender.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=   # optional — enables Google Sign-In
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=       # optional — enables Google Sign-In
```

**Mobile features:** goal creation with scheduling constraints, day-by-day task calendar, step-by-step task detail sheet, adaptive feedback with schedule re-generation, Google Calendar sync, feedback history, and admin panel (admin users only).

---

## License

MIT
