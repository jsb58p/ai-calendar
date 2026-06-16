# Architecture Decision Records

---

## 1. Zustand over Redux for state management

**Context:** The frontend needed a global state solution to avoid prop drilling across a moderately complex component tree (10+ components, several modals).

**Decision:** Use Zustand.

**Reasoning:** Zustand requires no boilerplate (no actions, reducers, or provider wrappers). State slices and their mutating actions live in a single `useAppStore.ts` file. Components subscribe to exactly the slice they need with a selector — no `mapStateToProps`, no `connect()`. The entire store is trivially typed in TypeScript.

**Trade-offs:** Redux DevTools are more mature for time-travel debugging, and Redux has better tooling for very large teams where strict action discipline matters. For a single-developer project with a bounded number of state shapes, that overhead is unnecessary cost.

---

## 2. MongoDB Atlas over lowdb for persistence

**Context:** The project originally used lowdb (a file-based JSON store) for fast local development. When preparing for Render deployment, file-system state became untenable — Render's free tier uses ephemeral containers that reset on every deploy and every cold start.

**Decision:** Migrate to MongoDB Atlas M0 (free cloud cluster).

**Reasoning:** MongoDB's document model maps naturally to the nested `{ goalId, tasks: [...] }` schedule shape without a JOIN. Atlas M0 is free, globally accessible, survives deploys, and the Node.js driver is well-typed. The `replaceOne` with `upsert: true` pattern gives idempotent upserts that match how the app writes data (always overwrite the whole document, never partial patches at the DB level).

**Trade-offs:** Adds a network round-trip to every DB call versus an in-process file read. The M0 free tier has a 512 MB cap and shared resources (potential latency spikes). A relational schema (PostgreSQL) would enforce referential integrity between goals and schedules, which MongoDB does not. For the current scale, these are acceptable trade-offs.

---

## 3. Tailwind CSS v4 with `@tailwindcss/vite`

**Context:** The project targets a custom dark-mode design system with semantic tokens (`bg-bg-surface`, `text-text-primary`, `border-border-default`, etc.) beyond the built-in Tailwind palette.

**Decision:** Use Tailwind v4 with the `@tailwindcss/vite` plugin and define custom tokens in `index.css` using CSS custom properties.

**Reasoning:** Tailwind v4 eliminates the `tailwind.config.js` file in favour of CSS-native `@theme` blocks. The Vite plugin handles JIT compilation without a separate PostCSS step.

**Gotcha — custom tokens need built-in palette fallbacks:** Tailwind v4 custom tokens defined in `@theme` work correctly in most contexts, but during Vitest's jsdom environment and in some SSR/build edge cases the CSS variables are not evaluated. Components that rely entirely on custom tokens for colour can render without any visible colour in tests. The fix is to pair custom token class names with built-in Tailwind utilities (e.g. `className="bg-bg-surface bg-zinc-900"`) so there is always a resolved value. See [decision #4](#4-inline-styles-alongside-tailwind) for the related inline-style strategy.

**Trade-offs:** Tailwind v4 is relatively new; some ecosystem tooling (IDE plugins, linting rules) still targets v3. The `@theme` syntax is not yet widely documented in community tutorials.

---

## 4. Inline styles alongside Tailwind

**Context:** Several components use both `className="..."` (Tailwind utilities) and `style={{ }}` (inline CSS) on the same element.

**Decision:** Use inline styles for design-token colour and spacing values that cannot be reliably resolved via Tailwind custom tokens.

**Reasoning:** Tailwind's JIT compiler generates CSS classes that reference CSS custom properties (`var(--color-bg-surface)`). In environments where those properties are not defined (Vitest jsdom, certain build steps), the class resolves to nothing and the element becomes invisible or unstyled. Inline styles bypass the CSS variable layer entirely — the value is always concrete.

The pattern used throughout: Tailwind for structural utilities (flex, gap, width, border-radius, overflow), inline styles for semantic colour and precise padding values that must match the design system tokens exactly.

**Trade-offs:** Mixing the two systems creates inconsistency that can confuse contributors. A future improvement would be to generate a static CSS variable file that is imported in the Vitest setup, making the tokens resolvable everywhere and eliminating the need for inline style fallbacks.

---

## 5. Anthropic API key kept server-side

**Context:** The app needs to call the Anthropic Claude API to generate and adapt schedules.

**Decision:** All Claude API calls are made from the Express backend. The `ANTHROPIC_API_KEY` is never sent to the frontend.

**Reasoning:** API keys embedded in frontend bundles are publicly readable by anyone who inspects the page source or network requests. A malicious user could extract the key and run arbitrary Claude API calls at the app owner's expense. By proxying all Claude calls through the backend, the key stays in a server-only environment variable and is never exposed to the client.

**Trade-offs:** Adds one network hop (browser → Render → Anthropic) instead of (browser → Anthropic directly). This is the correct trade-off — key security outweighs latency.

---

## 6. ESM vs CommonJS — dev with `tsx`, prod with `tsc`

**Context:** Node.js's module system has two incompatible formats (ESM and CommonJS). TypeScript adds a third layer. The backend needed to work in three environments: local dev (`tsx` for hot reload), test (`vitest`), and production (`node dist/index.js`).

**Decision:** Remove `"type": "module"` from `backend/package.json`. Compile to CommonJS with `tsc`. Use `tsx` for dev and `vitest` for tests (both handle TypeScript directly without caring about the package type field).

**Reasoning:** When `"type": "module"` is set, Node.js expects all `.js` files to use ESM (`import`/`export`). `tsc` with `"module": "commonjs"` emits `require()`-based CommonJS — Node.js then rejects these files because they don't match the declared type. Removing `"type": "module"` lets Node.js treat `.js` files as CommonJS by default, which matches tsc's output. `tsx` and `vitest` process TypeScript files directly so they are unaffected by this field.

**Trade-offs:** The backend source uses ESM syntax (`import`/`export`) even though the compiled output is CommonJS. This can be confusing. A fully ESM setup (compile with `"module": "ESNext"`, run with `--experimental-vm-modules` in vitest) is possible but requires more configuration and has more edge cases with the Node.js ecosystem's partial ESM support.

---

## 7. Vite proxy in development instead of backend CORS

**Context:** In development, the frontend runs on `localhost:5173` and the backend runs on `localhost:3001`. Browser same-origin policy blocks cross-origin `fetch` calls.

**Decision:** Configure Vite's `server.proxy` to forward `/api/*` requests to `localhost:3001` during development. In production, the frontend calls the Render backend URL directly (cross-origin, handled by backend CORS).

**Reasoning:** The Vite proxy makes all API calls same-origin from the browser's perspective — no CORS preflight, no credential issues. This eliminates an entire class of local development friction. The production path uses real CORS (the backend allows `FRONTEND_URL` in its `allowedOrigins` list), so both environments are fully supported.

**Trade-offs:** The proxy is only active when `mode !== 'production'`. If the Vite config incorrectly detects mode in some build scenario, requests could silently fail. The `defineConfig(({ mode }) => ...)` function form makes the mode detection explicit and predictable.

---

## 8. All-day Google Calendar events use `end.date` = day after `start.date`

**Context:** Google Calendar's API represents all-day events with `start.date` and `end.date` (date strings, not datetimes). The end date for a single-day all-day event must be the day *after* the start date — this is how the Google Calendar API defines the exclusive end boundary.

**Decision:** When creating calendar events, always set `end.date` to `start.date + 1 day`.

**Reasoning:** If `start.date` and `end.date` are the same value, Google Calendar creates a zero-duration event that does not appear in the calendar view. Setting `end.date` to the next day makes the event appear as a full-day block on `start.date`, which is the expected user experience.

**Trade-offs:** None — this is a requirement of the Google Calendar API, not a design choice.

---

## 9. `vi.hoisted()` for Vitest mock state

**Context:** The backend's MongoDB tests needed a shared in-memory store that:
1. Is mutated by the `MockCollection` methods inside `vi.mock()`
2. Can be reset in `beforeEach()` outside the mock factory

**Decision:** Use `vi.hoisted()` to create the shared store object before mock registration.

**Reasoning:** Vitest hoists `vi.mock()` calls to the top of the file (before any imports) so that imports always receive the mock. But variables declared with `const` in the test file body are not available inside the hoisted mock factory closures — they haven't been initialised yet. `vi.hoisted(() => value)` runs the initialiser before the mock is registered, making the returned value accessible in both the mock factory and the test body.

```typescript
const store = vi.hoisted((): Record<string, any[]> => ({}))
vi.mock('mongodb', () => {
  // store is defined here — vi.hoisted() ran first
})
beforeEach(() => {
  Object.keys(store).forEach((k) => { delete store[k] }) // reset between tests
})
```

**Trade-offs:** `vi.hoisted()` is a Vitest-specific API with no Jest equivalent. Tests are readable once the pattern is understood, but it's not obvious to developers who haven't encountered it.

---

## 10. `react-markdown` for step instructions

**Context:** Claude returns `stepInstructions` as an array of markdown-formatted strings. Steps may contain bold text, inline code, bullet lists, and headings.

**Decision:** Render step instructions with `react-markdown` and custom component overrides.

**Reasoning:** Rendering markdown as raw HTML (`dangerouslySetInnerHTML`) opens an XSS vector if Claude ever returns unexpected content. `react-markdown` parses the markdown AST and renders it through React's reconciler — no raw HTML injection. Custom `components` overrides (`p`, `strong`, `code`, `ul`, etc.) allow full Tailwind styling of every markdown element type.

**Trade-offs:** `react-markdown` adds ~30 KB to the bundle (gzipped). For the use case (step-by-step instructions), this is justified by the safety and formatting benefits. A lighter alternative would be a small bespoke regex-based renderer, but that would need ongoing maintenance as Claude's formatting evolves.

---

## 11. Authorization header over httpOnly cookies for production

**Context:** JWT sessions needed to work cross-origin (Vercel frontend → Render backend). The initial implementation used httpOnly cookies.

**Decision:** Store JWT in `localStorage` and send it as an `Authorization: Bearer <token>` header via an axios request interceptor. The httpOnly cookie is kept as a dev/fallback mechanism only.

**Reasoning:** httpOnly cookies with `SameSite=None` require `Secure=true` and are actively blocked by Safari's Intelligent Tracking Prevention (ITP) and Brave's privacy defaults for cross-origin third-party cookies. `Authorization` headers are not subject to the same browser cookie policies and work reliably for cross-origin API calls in all browsers.

The axios interceptor (`api.interceptors.request.use(...)`) reads `localStorage.getItem('auth_token')` synchronously and attaches the header to every request without modifying any individual call site.

**Trade-offs:** `localStorage` is accessible to JavaScript running on the page, making it vulnerable to XSS attacks (unlike httpOnly cookies, which JavaScript cannot read). This risk is mitigated by the Content Security Policy header and by avoiding `eval()`, `dangerouslySetInnerHTML`, and dynamic script injection throughout the codebase. For the current threat model and user scale, this is an acceptable trade-off over the cross-browser reliability problems with cross-origin cookies.

---

## 12. Resend for transactional email

**Context:** Email verification and admin-triggered password reset require a transactional email provider.

**Decision:** Use Resend (`resend.com`) with the `resend` Node.js SDK.

**Reasoning:** Resend's free tier allows 3,000 emails/month with no credit card required. The SDK is minimal — `new Resend(apiKey).emails.send({ from, to, subject, html })` — and integrates in under 20 lines. Delivery is reliable and the developer experience (logs, error messages) is significantly better than alternatives like Nodemailer with SMTP.

**Trade-offs:** The free tier restricts the sender domain to `onboarding@resend.dev`. Custom sender domains (e.g. `hello@schedulerai.app`) require DNS verification and a paid plan. For the current stage this is acceptable; the free sender address is functional even if not branded.

---

## 13. `isAdmin` flag on User document

**Context:** Admin functionality (user listing, suspension, deletion, password reset) was needed without introducing a separate admin user type or role collection.

**Decision:** Add `isAdmin?: boolean` to the `User` document. Grant admin status via the `make-admin` CLI script (`cd backend && npm run make-admin email@example.com`).

**Reasoning:** A single optional boolean on the existing document is the simplest possible solution. No additional collection, no role join, no migration. The `requireAdmin` middleware checks `req.user?.isAdmin` after `requireAuth` has already verified the JWT and attached the user — adding the flag to the JWT payload means the check is O(1) with no additional DB call.

**Trade-offs:** Admin status is baked into the JWT at login time. If an admin revokes another user's admin status, that user's existing JWT still carries `isAdmin: true` until expiry (up to 7 days). For the current use case (small user base, trusted admins), this is acceptable. A future mitigation would be a token blocklist or shorter JWT TTL for admin actions.

---

## 14. React Native `Modal` over `@gorhom/bottom-sheet` for Android

**Context:** The task detail screen needed a bottom sheet on Android. `@gorhom/bottom-sheet` v5 is the standard choice for React Native bottom sheets.

**Decision:** Use React Native's built-in `Modal` (`animationType="slide"`, `transparent`) instead of `@gorhom/bottom-sheet`.

**Reasoning:** `@gorhom/bottom-sheet` v5 with `enableDynamicSizing={false}` and `BottomSheetScrollView` collapses to zero height on Android when used inside a `BottomSheetModal`. The root cause is a Yoga layout conflict with Reanimated v3 worklets — the sheet measures as `height: 0` on the first render pass and never recovers. This was reproducible across all tested configurations (index prop, snap points, View wrappers). React Native's `Modal` is a guaranteed primitive that renders in a system overlay, bypassing all Yoga layout constraints.

**Trade-offs:** Loses gesture-driven drag-to-dismiss. A `TouchableOpacity` backdrop covering the scrim provides tap-to-dismiss with equivalent UX. The `Animated.spring` opacity animation on the panel provides a subtle open animation.

---

## 15. NativeWind v3 + Tailwind CSS v3 for React Native styling

**Context:** The web app uses a custom dark-mode design system with semantic tokens (`bg-bg-surface`, `text-text-primary`, etc.) defined in Tailwind v4 `@theme` blocks. The mobile app needed the same token set.

**Decision:** Use NativeWind v3 with Tailwind CSS v3 (not v4) for the mobile app. Duplicate the design token definitions in `mobile/tailwind.config.js`.

**Reasoning:** NativeWind v4 requires Tailwind CSS v4 and uses a completely different babel transform pipeline that is not stable for Expo SDK 54. NativeWind v3 is production-ready, well-tested with Expo, and uses a standard `tailwind.config.js` extending the same token names. The duplicated token definitions are an acceptable cost given the otherwise shared design language.

**Trade-offs:** Design tokens exist in two places (`frontend/src/index.css` and `mobile/tailwind.config.js`). A future improvement would extract the token values into a shared JS/JSON config consumed by both. Tailwind v4 features (Lightning CSS, `@import` syntax, container queries) are unavailable on mobile.

---

## 16. `expo-secure-store` over `localStorage` for JWT on mobile

**Context:** JWT tokens need secure persistent storage on Android. `localStorage` does not exist in React Native.

**Decision:** Use `expo-secure-store` for all JWT token storage. Read the token asynchronously in an axios request interceptor before each API call.

**Reasoning:** `expo-secure-store` uses the Android Keystore system (AES-256 encrypted) for storage, making it the secure equivalent of httpOnly cookies on mobile. The token is read with `await SecureStore.getItemAsync('auth_token')` inside the interceptor; axios will wait for the promise before dispatching the request.

**Trade-offs:** SecureStore reads are async, while `localStorage` reads are synchronous. This means the axios interceptor must be `async` and return a promise, which adds a small per-request overhead (typically < 1 ms once the OS has the key cached). On app cold start, the interceptor may fire before the auth gate (`app/index.tsx`) has finished its `getMe()` call — this is safe because unauthenticated API calls simply receive a 401 and the auth gate handles the redirect.
