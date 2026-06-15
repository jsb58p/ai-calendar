import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../store/useAppStore'
import type { GoalInput, Schedule } from '../types'

const TEST_USER = {
  id: 'user-1',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
}

beforeEach(() => {
  useAppStore.setState({
    currentUser: null,
    isAuthenticated: false,
    authLoading: true,
    goals: [],
    schedules: {},
  })
})

describe('auth store', () => {
  it('test 1: setCurrentUser sets currentUser and isAuthenticated to true', () => {
    useAppStore.getState().setCurrentUser(TEST_USER)
    const state = useAppStore.getState()
    expect(state.currentUser).toEqual(TEST_USER)
    expect(state.isAuthenticated).toBe(true)
  })

  it('test 2: logout() clears currentUser and sets isAuthenticated to false', () => {
    useAppStore.getState().setCurrentUser(TEST_USER)
    useAppStore.getState().logout()
    const state = useAppStore.getState()
    expect(state.currentUser).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('test 3: logout() clears goals and schedules from store', () => {
    const mockGoal: GoalInput = {
      id: 'g1',
      userId: 'u1',
      title: 'Test Goal',
      description: 'A goal',
      targetDate: '2025-12-31',
      createdAt: '2025-01-01',
    }
    const mockSchedule: Schedule = { goalId: 'g1', tasks: [] }
    useAppStore.setState({ goals: [mockGoal], schedules: { g1: mockSchedule } })
    useAppStore.getState().logout()
    const state = useAppStore.getState()
    expect(state.goals).toHaveLength(0)
    expect(Object.keys(state.schedules)).toHaveLength(0)
  })

  it('test 4: initial state has currentUser: null and isAuthenticated: false', () => {
    const state = useAppStore.getState()
    expect(state.currentUser).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})
