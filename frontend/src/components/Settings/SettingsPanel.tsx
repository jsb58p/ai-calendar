import { useState, useEffect } from 'react'
import { Modal, Button, Input } from '../ui'
import { useAppStore } from '../../store/useAppStore'
import { DEFAULT_SETTINGS } from '../../types'
import type { UserSettings } from '../../types'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const RAMP_OPTIONS: { value: UserSettings['difficultyRamp']; label: string; testId: string }[] = [
  { value: 'easy-to-hard', label: 'Gradual build-up (easy → hard)', testId: 'ramp-easy-to-hard' },
  { value: 'flat',         label: 'Consistent difficulty',           testId: 'ramp-flat' },
  { value: 'hard-to-easy', label: 'Front-loaded (hard → easy)',      testId: 'ramp-hard-to-easy' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: Props) {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const resetSettings = useAppStore((s) => s.resetSettings)

  const [availableDays, setAvailableDays]   = useState(settings.availableDays)
  const [startTime, setStartTime]           = useState(settings.dailyStartTime)
  const [endTime, setEndTime]               = useState(settings.dailyEndTime)
  const [minDuration, setMinDuration]       = useState(settings.minTaskDuration)
  const [maxDuration, setMaxDuration]       = useState(settings.maxTaskDuration)
  const [difficultyRamp, setDifficultyRamp] = useState(settings.difficultyRamp)
  const [reviewDay, setReviewDay]           = useState(settings.weeklyReviewDay)
  const [blackoutDates, setBlackoutDates]   = useState(settings.blackoutDates)
  const [blackoutDateInput, setBlackoutDateInput] = useState('')

  // Re-sync local state each time the modal opens so stale edits are discarded
  useEffect(() => {
    if (!isOpen) return
    setAvailableDays(settings.availableDays)
    setStartTime(settings.dailyStartTime)
    setEndTime(settings.dailyEndTime)
    setMinDuration(settings.minTaskDuration)
    setMaxDuration(settings.maxTaskDuration)
    setDifficultyRamp(settings.difficultyRamp)
    setReviewDay(settings.weeklyReviewDay)
    setBlackoutDates(settings.blackoutDates)
    setBlackoutDateInput('')
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const timeError     = endTime <= startTime ? 'End time must be after start time' : undefined
  const durationError = maxDuration <= minDuration ? 'Max duration must be greater than min duration' : undefined
  const hasError      = !!timeError || !!durationError

  function toggleDay(day: number) {
    setAvailableDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev // always keep at least one day
        return prev.filter((d) => d !== day)
      }
      return [...prev, day].sort((a, b) => a - b)
    })
  }

  function handleAddBlackoutDate() {
    if (!blackoutDateInput) return
    const today = new Date().toISOString().substring(0, 10)
    if (blackoutDateInput <= today) return
    if (blackoutDates.includes(blackoutDateInput)) return
    setBlackoutDates((prev) => [...prev, blackoutDateInput].sort())
    setBlackoutDateInput('')
  }

  function handleRemoveBlackoutDate(date: string) {
    setBlackoutDates((prev) => prev.filter((d) => d !== date))
  }

  function handleReset() {
    resetSettings()
    setAvailableDays(DEFAULT_SETTINGS.availableDays)
    setStartTime(DEFAULT_SETTINGS.dailyStartTime)
    setEndTime(DEFAULT_SETTINGS.dailyEndTime)
    setMinDuration(DEFAULT_SETTINGS.minTaskDuration)
    setMaxDuration(DEFAULT_SETTINGS.maxTaskDuration)
    setDifficultyRamp(DEFAULT_SETTINGS.difficultyRamp)
    setReviewDay(DEFAULT_SETTINGS.weeklyReviewDay)
    setBlackoutDates(DEFAULT_SETTINGS.blackoutDates)
  }

  function handleSave() {
    if (hasError) return
    updateSettings({
      availableDays,
      dailyStartTime: startTime,
      dailyEndTime: endTime,
      minTaskDuration: minDuration,
      maxTaskDuration: maxDuration,
      difficultyRamp,
      weeklyReviewDay: reviewDay,
      blackoutDates,
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" maxWidth="580px">
      <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-1">

        {/* Section 1: Available Days */}
        <section>
          <p className="text-text-secondary text-sm font-medium mb-3">
            Which days are you available to work on this goal?
          </p>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((label, i) => {
              const active = availableDays.includes(i)
              return (
                <button
                  key={i}
                  type="button"
                  data-testid={`day-toggle-${i}`}
                  onClick={() => toggleDay(i)}
                  className={[
                    'flex-1 py-2 text-xs font-medium rounded-md border transition-colors duration-150',
                    active
                      ? 'bg-accent text-white border-accent'
                      : 'bg-bg-muted text-text-secondary border-border-default hover:border-accent/50 hover:text-text-primary',
                  ].join(' ')}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Section 2: Daily Availability Window */}
        <section>
          <p className="text-text-secondary text-sm font-medium mb-3">Daily Availability Window</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start time"
              type="time"
              value={startTime}
              data-testid="start-time-input"
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              label="End time"
              type="time"
              value={endTime}
              data-testid="end-time-input"
              error={timeError}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </section>

        {/* Section 3: Task Duration */}
        <section>
          <p className="text-text-secondary text-sm font-medium mb-3">Task Duration</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min duration (min)"
              type="number"
              min={5}
              max={240}
              value={minDuration}
              data-testid="min-duration-input"
              onChange={(e) => setMinDuration(Number(e.target.value))}
            />
            <Input
              label="Max duration (min)"
              type="number"
              min={15}
              max={480}
              value={maxDuration}
              data-testid="max-duration-input"
              error={durationError}
              onChange={(e) => setMaxDuration(Number(e.target.value))}
            />
          </div>
        </section>

        {/* Section 4: Difficulty Progression */}
        <section>
          <p className="text-text-secondary text-sm font-medium mb-3">Difficulty Progression</p>
          <div className="flex flex-col gap-2.5">
            {RAMP_OPTIONS.map(({ value, label, testId }) => (
              <label key={value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="difficultyRamp"
                  value={value}
                  data-testid={testId}
                  checked={difficultyRamp === value}
                  onChange={() => setDifficultyRamp(value)}
                  className="w-4 h-4 accent-[#6366f1] cursor-pointer"
                />
                <span className="text-text-primary text-sm group-hover:text-text-primary/90">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Section 5: Weekly Review Day */}
        <section>
          <p className="text-text-secondary text-sm font-medium mb-3">Weekly Review Day</p>
          <select
            data-testid="review-day-select"
            value={reviewDay}
            onChange={(e) => setReviewDay(Number(e.target.value))}
            className="w-full bg-bg-muted border border-border-default rounded-md px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-border-accent focus:ring-1 focus:ring-accent transition-colors duration-150"
          >
            {DAY_LABELS.map((label, i) => (
              <option key={i} value={i}>{label}</option>
            ))}
          </select>
        </section>

        {/* Section 6: Blackout Dates */}
        <section>
          <p className="text-text-secondary text-sm font-medium mb-1">Blackout Dates (optional)</p>
          <p className="text-text-muted text-xs mb-3">
            Days you&apos;re unavailable (vacations, holidays, etc.)
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="date"
              data-testid="blackout-date-input"
              value={blackoutDateInput}
              onChange={(e) => setBlackoutDateInput(e.target.value)}
              min={new Date().toISOString().substring(0, 10)}
              className="flex-1 bg-bg-muted border border-border-default rounded-md px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-150"
            />
            <Button
              type="button"
              data-testid="add-blackout-button"
              variant="secondary"
              size="sm"
              onClick={handleAddBlackoutDate}
            >
              Add
            </Button>
          </div>
          {blackoutDates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {blackoutDates.map((date) => (
                <span
                  key={date}
                  className="font-mono text-xs bg-bg-muted border border-border-default rounded-md px-2 py-1 flex items-center gap-2"
                >
                  <span>{date}</span>
                  <button
                    type="button"
                    data-testid={`remove-blackout-${date}`}
                    onClick={() => handleRemoveBlackoutDate(date)}
                    className="text-text-muted hover:text-danger transition-colors leading-none"
                    aria-label={`Remove blackout date ${date}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 mt-2 border-t border-border-default">
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Reset to Defaults
        </Button>
        <Button variant="primary" disabled={hasError} onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </Modal>
  )
}
