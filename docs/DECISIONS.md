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
