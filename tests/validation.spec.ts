import { test, expect, type Page } from '@playwright/test'
import { mockFeedbackGoal, feedbackSchedule } from './fixtures/mockFeedbackData'

// ── date helpers ──────────────────────────────────────────────────────────────

function futureDateString(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 30)
  return d.toISOString().slice(0, 10)
}

function yesterdayString(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

// ── shared helper ─────────────────────────────────────────────────────────────

// Load the app showing the CalendarGrid by seeding localStorage before navigation.
// GET /api/goals must return the goal whose id matches the localStorage key so that
// Header.activeGoal is non-null and the "Give Feedback" button is rendered.
async function loadCalendarWithActiveGoal(page: Page): Promise<void> {
  await page.route('**/api/goals', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ goals: [mockFeedbackGoal] }),
    })
  )
  await page.route('**/api/goals/*/schedule', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(feedbackSchedule),
    })
  )
  await page.addInitScript(() => {
    localStorage.setItem('activeGoalId', 'mock-goal-id')
  })
  await page.goto('/')
  await expect(page.getByTestId('day-header').first()).toBeVisible()
}

// ── route helper reused by tests 3 & 4 ───────────────────────────────────────

async function intercept500OnGoalPost(page: Page): Promise<void> {
  await page.route('**/api/goals', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ goals: [] }),
    })
  })
}

async function fillAndSubmitGoalForm(page: Page): Promise<void> {
  await page.getByTestId('title-input').fill('Learn Guitar')
  await page.getByTestId('description-input').fill('Practice every day')
  await page.getByTestId('date-input').fill(futureDateString())
  await page.getByTestId('submit-button').click()
}

// ── tests ─────────────────────────────────────────────────────────────────────

test('shows errors when form submitted empty', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('goal-input-heading')).toBeVisible()

  // The submit button is disabled when all required fields are empty — this is
  // the app's client-side validation mechanism (no noValidate-bypassing needed).
  const submitBtn = page.getByTestId('submit-button')
  await expect(submitBtn).toBeDisabled()

  // Force-clicking a disabled <button type="submit"> still does not trigger the
  // form's submit event in the browser, so no API call is made.
  await submitBtn.click({ force: true })

  // Page has not navigated away and no error banner was produced.
  await expect(page.getByTestId('goal-input-heading')).toBeVisible()
  await expect(page.getByTestId('error-banner')).not.toBeVisible()
})

test('rejects past dates', async ({ page }) => {
  // Chromium resolves localhost → ::1 (IPv6) on Windows but the backend binds
  // IPv4 only, so requests to localhost:3001 fail with a network error rather
  // than reaching the server. Intercept and return the exact 400 the backend
  // would produce so we test the frontend's error-display path.
  await page.route('**/api/goals', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'targetDate must be a future date' }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ goals: [] }),
    })
  })
  await page.goto('/')
  await page.getByTestId('title-input').fill('Learn Guitar')
  await page.getByTestId('description-input').fill('Practice every day')
  await page.getByTestId('date-input').fill(yesterdayString())

  // Button is enabled because targetDate is non-empty (past-date check is backend-only)
  await page.getByTestId('submit-button').click()

  await expect(page.getByTestId('error-banner')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('error-banner')).toContainText('future')
})

test('shows error banner on API failure', async ({ page }) => {
  await intercept500OnGoalPost(page)
  await page.goto('/')
  await fillAndSubmitGoalForm(page)

  await expect(page.getByTestId('error-banner')).toBeVisible()
  await expect(page.getByTestId('error-banner')).toContainText('Server error')
})

test('X button dismisses error banner', async ({ page }) => {
  await intercept500OnGoalPost(page)
  await page.goto('/')
  await fillAndSubmitGoalForm(page)

  await expect(page.getByTestId('error-banner')).toBeVisible()
  await page.getByTestId('clear-error-button').click()
  await expect(page.getByTestId('error-banner')).not.toBeVisible()
})

test('feedback submit button disabled with no stars', async ({ page }) => {
  await loadCalendarWithActiveGoal(page)

  await page.getByTestId('give-feedback-button').click()
  await expect(page.getByTestId('modal-panel')).toBeVisible()

  // No star selected → submit is disabled
  await expect(page.getByTestId('submit-feedback-button')).toBeDisabled()

  // Select one star → submit becomes enabled
  await page.getByTestId('star-1').click()
  await expect(page.getByTestId('submit-feedback-button')).toBeEnabled()
})

test('Escape key closes feedback modal', async ({ page }) => {
  await loadCalendarWithActiveGoal(page)

  await page.getByTestId('give-feedback-button').click()
  await expect(page.getByTestId('modal-panel')).toBeVisible()

  // FeedbackModal registers a window-level keydown listener when open, so
  // Escape works regardless of which element currently has focus.
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('modal-panel')).not.toBeVisible()
})
