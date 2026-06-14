import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Hoist mock fns so they are available inside the vi.mock factory
// ---------------------------------------------------------------------------
const mockUpdateSettings = vi.hoisted(() => vi.fn())
const mockResetSettings  = vi.hoisted(() => vi.fn())

// Mutable store state — modified per-test in beforeEach or inline
const mockStoreState = vi.hoisted(() => ({
  settings: {
    availableDays: [1, 2, 3, 4, 5] as number[],
    dailyStartTime: '09:00',
    dailyEndTime:   '17:00',
    minTaskDuration: 15,
    maxTaskDuration: 120,
    difficultyRamp: 'easy-to-hard' as const,
    weeklyReviewDay: 0,
    blackoutDates: [] as string[],
    timezone: 'UTC',
  },
  updateSettings: mockUpdateSettings,
  resetSettings:  mockResetSettings,
}))

vi.mock('../store/useAppStore', () => ({
  useAppStore: (selector: (s: typeof mockStoreState) => unknown) =>
    selector(mockStoreState),
}))

import { SettingsPanel } from '../components/Settings/SettingsPanel'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DEFAULT_SETTINGS_DAYS = [1, 2, 3, 4, 5]

function resetMockSettings() {
  mockStoreState.settings = {
    availableDays: [...DEFAULT_SETTINGS_DAYS],
    dailyStartTime: '09:00',
    dailyEndTime:   '17:00',
    minTaskDuration: 15,
    maxTaskDuration: 120,
    difficultyRamp: 'easy-to-hard',
    weeklyReviewDay: 0,
    blackoutDates: [],
    timezone: 'UTC',
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  resetMockSettings()
})

const noop = () => {}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('SettingsPanel', () => {
  it('renders when isOpen is true', () => {
    render(<SettingsPanel isOpen={true} onClose={noop} />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('returns null when isOpen is false', () => {
    render(<SettingsPanel isOpen={false} onClose={noop} />)
    expect(screen.queryByText('Settings')).not.toBeInTheDocument()
  })

  it('all 7 day toggle buttons render', () => {
    render(<SettingsPanel isOpen={true} onClose={noop} />)
    for (let i = 0; i < 7; i++) {
      expect(screen.getByTestId(`day-toggle-${i}`)).toBeInTheDocument()
    }
  })

  it('Monday toggle is active by default (in DEFAULT_SETTINGS.availableDays)', () => {
    render(<SettingsPanel isOpen={true} onClose={noop} />)
    expect(screen.getByTestId('day-toggle-1')).toHaveClass('bg-accent')
  })

  it('Sunday toggle is inactive by default', () => {
    render(<SettingsPanel isOpen={true} onClose={noop} />)
    expect(screen.getByTestId('day-toggle-0')).not.toHaveClass('bg-accent')
  })

  it('clicking an active day removes it from selection', async () => {
    const user = userEvent.setup()
    render(<SettingsPanel isOpen={true} onClose={noop} />)
    const monBtn = screen.getByTestId('day-toggle-1')
    expect(monBtn).toHaveClass('bg-accent')
    await user.click(monBtn)
    expect(monBtn).not.toHaveClass('bg-accent')
  })

  it('clicking an inactive day adds it to selection', async () => {
    const user = userEvent.setup()
    render(<SettingsPanel isOpen={true} onClose={noop} />)
    const sunBtn = screen.getByTestId('day-toggle-0')
    expect(sunBtn).not.toHaveClass('bg-accent')
    await user.click(sunBtn)
    expect(sunBtn).toHaveClass('bg-accent')
  })

  it('cannot deselect all days — last remaining active day click is ignored', async () => {
    // Only Wednesday is selected
    mockStoreState.settings = { ...mockStoreState.settings, availableDays: [3] }
    const user = userEvent.setup()
    render(<SettingsPanel isOpen={true} onClose={noop} />)
    const wedBtn = screen.getByTestId('day-toggle-3')
    expect(wedBtn).toHaveClass('bg-accent')
    await user.click(wedBtn)
    expect(wedBtn).toHaveClass('bg-accent') // still active — guard held
  })

  it('start time input renders with default value "09:00"', () => {
    render(<SettingsPanel isOpen={true} onClose={noop} />)
    expect(screen.getByTestId('start-time-input')).toHaveValue('09:00')
  })

  it('end time input renders with default value "17:00"', () => {
    render(<SettingsPanel isOpen={true} onClose={noop} />)
    expect(screen.getByTestId('end-time-input')).toHaveValue('17:00')
  })

  it('setting end time before start time shows validation error', () => {
    render(<SettingsPanel isOpen={true} onClose={noop} />)
    fireEvent.change(screen.getByTestId('end-time-input'), { target: { value: '08:00' } })
    expect(screen.getByText('End time must be after start time')).toBeInTheDocument()
  })

  it('min duration input renders with default value 15', () => {
    render(<SettingsPanel isOpen={true} onClose={noop} />)
    expect(screen.getByTestId('min-duration-input')).toHaveValue(15)
  })

  it('clicking "Reset to Defaults" calls resetSettings', async () => {
    const user = userEvent.setup()
    render(<SettingsPanel isOpen={true} onClose={noop} />)
    await user.click(screen.getByRole('button', { name: /reset to defaults/i }))
    expect(mockResetSettings).toHaveBeenCalledOnce()
  })

  it('clicking "Save Settings" calls updateSettings with form state and closes modal', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<SettingsPanel isOpen={true} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /save settings/i }))
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      availableDays:   [1, 2, 3, 4, 5],
      dailyStartTime:  '09:00',
      dailyEndTime:    '17:00',
      minTaskDuration: 15,
      maxTaskDuration: 120,
      difficultyRamp:  'easy-to-hard',
      weeklyReviewDay: 0,
    })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
