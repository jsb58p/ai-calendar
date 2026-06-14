import { test, expect } from '@playwright/test'
import { mockGoal, mockSchedule } from './fixtures/mockSchedule'

// 30 days from today in UTC (matching timezoneId: 'UTC' in playwright.config.ts)
function targetDateIn30Days(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 30)
  return d.toISOString().slice(0, 10)
}

test.beforeEach(async ({ page }) => {
  // GET /api/goals  →  fetchGoals() on app mount (returns goals list so Header doesn't crash)
  // POST /api/goals →  submitGoal() from GoalInput form
  // The 150ms delay on POST lets React flush the setLoading(true) render so the spinner
  // is visible before the response arrives (React 18 batching otherwise elides it).
  await page.route('**/api/goals', async (route) => {
    if (route.request().method() === 'POST') {
      await new Promise((r) => setTimeout(r, 150))
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ goal: mockGoal, schedule: mockSchedule }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ goals: [mockGoal] }),
    })
  })

  // GET /api/goals/:id/schedule  →  fetchSchedule() if localStorage has activeGoalId on reload
  await page.route('**/api/goals/*/schedule', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSchedule),
    })
  )

  // PATCH /api/goals/:goalId/tasks/:taskId  →  persistStatus() fire-and-forget in TaskDetail
  await page.route('**/api/goals/*/tasks/*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...mockSchedule.tasks[0], status: 'complete' }),
    })
  )
})

test('completes the full goal-to-calendar flow', async ({ page }) => {
  // Step 1: navigate to '/'
  await page.goto('/')

  // Step 2: heading 'What's your goal?' is visible
  await expect(page.getByTestId('goal-input-heading')).toBeVisible()

  // Step 3: fill in goal title
  await page.getByTestId('title-input').fill('Learn TypeScript')

  // Step 4: fill in description
  await page.getByTestId('description-input').fill('Master TypeScript fundamentals in 30 days')

  // Step 5: fill in target date (30 days from today)
  await page.getByTestId('date-input').fill(targetDateIn30Days())

  // Step 6: submit the form
  await page.getByTestId('submit-button').click()

  // Step 7: loading spinner appears, then disappears
  await expect(page.getByTestId('loading-spinner')).toBeVisible()
  await expect(page.getByTestId('loading-spinner')).not.toBeVisible()

  // Step 8: calendar renders (day-header labels are present)
  await expect(page.getByTestId('day-header').first()).toBeVisible()

  // Step 9: at least one task card is visible in the calendar
  await expect(page.getByTestId('task-card').first()).toBeVisible()

  // Step 10: click the first task card to open the detail panel
  await page.getByTestId('task-card').first().click()

  // Step 11: task detail panel is visible
  await expect(page.getByTestId('task-detail-panel')).toBeVisible()

  // Step 12: mark the task as complete
  await page.getByTestId('mark-complete-button').click()

  // Step 13: panel closes automatically after completion
  await expect(page.getByTestId('task-detail-panel')).not.toBeVisible()

  // Step 14: the same task card now has a green status dot
  await expect(
    page.getByTestId('task-card').first().getByTestId('status-dot')
  ).toHaveClass(/bg-green-500/)
})
