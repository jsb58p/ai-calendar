import { test, expect } from '@playwright/test'
import { mockFeedbackGoal, feedbackSchedule, mockAdaptedSchedule } from './fixtures/mockFeedbackData'

test.beforeEach(async ({ page }) => {
  // Intercept GET /api/goals (fetchGoals) and POST /api/goals (submitGoal)
  // GET must return a goal whose id === 'mock-goal-id' so Header shows the
  // "Give Feedback" button (it renders only when goals.find(g => g.id === activeGoalId)).
  await page.route('**/api/goals', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ goal: mockFeedbackGoal, schedule: feedbackSchedule }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ goals: [mockFeedbackGoal] }),
    })
  })

  // GET /api/goals/:id/schedule — called on mount when localStorage has activeGoalId
  await page.route('**/api/goals/*/schedule', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(feedbackSchedule),
    })
  )

  // POST /api/feedback — called when the feedback form is submitted
  await page.route('**/api/feedback', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        adapted: mockAdaptedSchedule,
        changesExplained: 'I moved 2 tasks to later in the week based on your feedback.',
      }),
    })
  )

  // PATCH /api/goals/*/tasks/* — fire-and-forget from TaskDetail (not used in this
  // flow, but intercept to prevent unhandled 404s reaching the backend)
  await page.route('**/api/goals/*/tasks/*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(feedbackSchedule.tasks[0]),
    })
  )

  // Inject localStorage before the page script runs so App.tsx sees activeGoalId
  // on mount and calls fetchSchedule instead of showing the GoalInput form.
  await page.addInitScript(() => {
    localStorage.setItem('activeGoalId', 'mock-goal-id')
  })

  await page.goto('/')

  // Wait for calendar to be visible before each test body runs
  await expect(page.getByTestId('day-header').first()).toBeVisible()
})

test('submits feedback and sees adapted schedule', async ({ page }) => {
  // Step 1: calendar grid is visible
  await expect(page.getByTestId('day-header').first()).toBeVisible()

  // Step 2: open the feedback modal
  await page.getByTestId('give-feedback-button').click()

  // Step 3: modal panel is visible
  await expect(page.getByTestId('modal-panel')).toBeVisible()

  // Step 4: select 4 stars
  await page.getByTestId('star-4').click()

  // Step 5: enter feedback notes
  await page.getByTestId('notes-input').fill('Tasks are too long, please shorten them')

  // Step 6: submit the feedback
  await page.getByTestId('submit-feedback-button').click()

  // Step 7: modal closes after a successful submission
  await expect(page.getByTestId('modal-panel')).not.toBeVisible()

  // Step 8: toast notification appears
  await expect(page.getByTestId('toast')).toBeVisible()

  // Step 9: toast contains the changesExplained text from the API
  await expect(page.getByTestId('toast')).toContainText('I moved 2 tasks to later in the week')

  // Step 10: toast auto-dismisses after 6 s (durationMs default); allow 8 s
  await expect(page.getByTestId('toast')).not.toBeVisible({ timeout: 8000 })
})
