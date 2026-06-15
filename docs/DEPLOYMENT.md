# Deployment

## Live Services

| Service | Provider | URL |
|---|---|---|
| Frontend | Vercel | https://schedulerai-frontend-eta.vercel.app |
| Backend | Render (free tier) | https://schedulerai-backend.onrender.com |
| Database | MongoDB Atlas M0 | Free cluster, `schedulerAI` database |

---

## Environment Variables

### Backend (Render)

| Variable | Purpose | Where to find it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Authenticates Claude API requests | [console.anthropic.com](https://console.anthropic.com) → Settings → API Keys |
| `MONGODB_URI` | MongoDB Atlas connection string | Atlas → Connect → Drivers → Node.js |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Same credentials page as above |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | Set to `https://schedulerai-backend.onrender.com/api/auth/google/callback` |
| `FRONTEND_URL` | CORS allow-list + OAuth redirect target | Set to `https://schedulerai-frontend-eta.vercel.app` |
| `PORT` | Port Render routes traffic to | Set to `10000` (Render's default) |
| `NODE_ENV` | Node environment | Set to `production` |

Set these in the Render service dashboard under **Environment → Environment Variables**.

### Frontend (Vercel)

| Variable | Purpose | Value |
|---|---|---|
| `VITE_API_URL` | Production backend base URL | `https://schedulerai-backend.onrender.com` |

Set this in the Vercel project dashboard under **Settings → Environment Variables**. The value is also committed in `frontend/.env.production` so Vercel picks it up automatically during builds.

---

## Deploy Process

Both services are connected to the GitHub repository and deploy automatically on every push to `master`. No manual deploy steps are required.

- **Vercel** triggers a new build whenever `master` receives a push. Build command: `cd frontend && npm install && npm run build`. Output directory: `frontend/dist`.
- **Render** triggers a new build whenever `master` receives a push. Build command: `npm install && npm run build`. Start command: `npm start` (runs `node dist/index.js`).

The `render.yaml` at the repo root declares the Render service configuration, but environment variable values are managed in the dashboard (they are never committed).

---

## Known Limitations

**Render free tier cold starts**
The backend service spins down after 15 minutes of inactivity. The first request after a period of idle will take 30–60 seconds while Render restarts the container. Subsequent requests are normal speed.

**Google Calendar OAuth — Testing mode**
The Google Cloud project is currently in OAuth "Testing" mode. Only Google accounts explicitly added as test users in the Cloud Console can complete the OAuth flow. To add a test user: Google Cloud Console → APIs & Services → OAuth consent screen → Test users → Add users.

To remove this limitation, publish the app (submit for Google verification). This requires a privacy policy URL and a demo video showing calendar scope usage.

**MongoDB M0 storage cap**
The free M0 cluster has a 512 MB storage limit. This is sufficient for roughly 10,000 users with typical usage. Upgrade to M10 ($57/month) if approaching the limit.

**No token refresh**
Google OAuth access tokens expire after 1 hour. The app stores the refresh token but does not currently call the token refresh endpoint automatically. Users need to re-connect Google Calendar if their session expires. A future improvement would add automatic token refresh in the calendar sync route.
