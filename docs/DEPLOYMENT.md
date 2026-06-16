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
| `GOOGLE_CLIENT_ID` | Google Calendar OAuth client ID | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google Calendar OAuth client secret | Same credentials page as above |
| `GOOGLE_REDIRECT_URI` | Google Calendar OAuth callback URL | Set to `https://schedulerai-backend.onrender.com/api/auth/google/callback` |
| `GOOGLE_AUTH_REDIRECT_URI` | Google Sign-In OAuth callback URL | Set to `https://schedulerai-backend.onrender.com/api/auth/users/google/callback` |
| `FRONTEND_URL` | CORS allow-list + OAuth redirect target | Set to `https://schedulerai-frontend-eta.vercel.app` |
| `JWT_SECRET` | Secret key for signing user JWTs | Generate with `openssl rand -hex 32` — keep secret |
| `JWT_EXPIRES_IN` | JWT expiry duration | Set to `7d` |
| `RESEND_API_KEY` | API key for sending transactional emails | [resend.com](https://resend.com) → API Keys |
| `EMAIL_FROM` | Sender address for verification/reset emails | `onboarding@resend.dev` (free tier) or your verified domain |
| `BACKEND_URL` | Backend base URL, used in email verification links | Set to `https://schedulerai-backend.onrender.com` |
| `PORT` | Port Render routes traffic to | Set to `10000` (Render's default) |
| `NODE_ENV` | Node environment | Set to `production` |

Set these in the Render service dashboard under **Environment → Environment Variables**.

### Frontend (Vercel)

| Variable | Purpose | Value |
|---|---|---|
| `VITE_API_URL` | Production backend base URL | `https://schedulerai-backend.onrender.com` |

Set this in the Vercel project dashboard under **Settings → Environment Variables**. The value is also committed in `frontend/.env.production` so Vercel picks it up automatically during builds.

### Mobile (local `mobile/.env`)

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend base URL |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth web client ID (optional) |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google OAuth Android client ID (optional) |

These variables are prefixed `EXPO_PUBLIC_` so Expo inlines them at bundle time. They are gitignored — never commit `mobile/.env`.

---

## Deploy Process

Both services are connected to the GitHub repository and deploy automatically on every push to `master`. No manual deploy steps are required.

- **Vercel** triggers a new build whenever `master` receives a push. Build command: `cd frontend && npm install && npm run build`. Output directory: `frontend/dist`.
- **Render** triggers a new build whenever `master` receives a push. Build command: `npm install && npm run build`. Start command: `npm start` (runs `node dist/index.js`).

The `render.yaml` at the repo root declares the Render service configuration, but environment variable values are managed in the dashboard (they are never committed).

---

## Admin Setup

After the first deploy, promote your account to admin so you can access the Admin Panel. Run the `make-admin` script against the production MongoDB by setting the `MONGODB_URI` env var locally:

```bash
MONGODB_URI="mongodb+srv://..." cd backend && npm run make-admin your@email.com
```

You must have already registered an account at the production URL before running this. The script sets `isAdmin: true` on the matching user document. The Admin Panel button then appears in the header on next login.

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

**Google Calendar tokens in localStorage**
Google Calendar OAuth tokens (`access_token`, `refresh_token`) are stored in `localStorage` only — they are not persisted server-side. Users must reconnect Google Calendar if they clear browser storage, switch devices, or use a different browser.

---

## Mobile Deployment

The mobile app currently runs via Expo Go for development. To build a standalone APK for distribution:

```bash
# 1. Create a free account at expo.dev
# 2. Install EAS CLI
npm install -g eas-cli

# 3. Login
eas login

# 4. Configure the build profile (run once)
cd mobile && eas build:configure

# 5. Build a preview APK (sideloadable)
eas build --platform android --profile preview
```

Download the `.apk` from the Expo dashboard at [expo.dev](https://expo.dev) and install it on your Android device.

For Google Play Store distribution:

```bash
eas build --platform android --profile production
```

Then submit via `eas submit --platform android`.

> **Note:** Google Sign-In on a standalone build requires an Android OAuth client ID with the app's **SHA-1 signing certificate fingerprint** registered in Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs. The SHA-1 can be retrieved from the EAS build details page after the first production build.
