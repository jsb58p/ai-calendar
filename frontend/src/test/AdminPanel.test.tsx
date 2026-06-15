import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AdminPanel } from '../components/Admin/AdminPanel'
import { useAppStore } from '../store/useAppStore'

// ---------------------------------------------------------------------------
// Mock client
// ---------------------------------------------------------------------------

vi.mock('../api/client', () => ({
  fetchAdminUsers: vi.fn(),
  deleteUser: vi.fn(),
  suspendUser: vi.fn(),
  resetUserPassword: vi.fn(),
  toggleUserAdmin: vi.fn(),
}))

import {
  fetchAdminUsers,
  deleteUser,
  suspendUser,
} from '../api/client'

// ---------------------------------------------------------------------------
// Mock Modal — renders children when isOpen, nothing otherwise
// ---------------------------------------------------------------------------

vi.mock('../components/ui/Modal', () => ({
  default: ({ isOpen, children, title, panelTestId }: {
    isOpen: boolean
    children: React.ReactNode
    title: string
    panelTestId?: string
  }) =>
    isOpen ? (
      <div data-testid={panelTestId ?? 'modal'}>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ADMIN_USER = {
  id: 'admin-1',
  email: 'admin@example.com',
  displayName: 'Admin User',
  emailVerified: true,
  isAdmin: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  goalCount: 2,
}

const REGULAR_USER = {
  id: 'user-2',
  email: 'user@example.com',
  displayName: 'Regular User',
  emailVerified: true,
  isAdmin: false,
  suspended: false,
  createdAt: '2026-01-02T00:00:00.000Z',
  goalCount: 5,
}

// ---------------------------------------------------------------------------
// Store helpers
// ---------------------------------------------------------------------------

function setStoreAdmin() {
  useAppStore.setState({
    currentUser: { id: 'admin-1', email: 'admin@example.com', displayName: 'Admin', emailVerified: true, isAdmin: true },
    isAdminPanelOpen: true,
  })
}

function setStoreNonAdmin() {
  useAppStore.setState({
    currentUser: { id: 'user-1', email: 'user@example.com', displayName: 'User', emailVerified: true },
    isAdminPanelOpen: true,
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  useAppStore.setState({ currentUser: null, isAdminPanelOpen: false })
})

describe('AdminPanel', () => {
  it('1: renders nothing when currentUser is not admin', () => {
    setStoreNonAdmin()
    const { container } = render(<AdminPanel />)
    expect(container.firstChild).toBeNull()
  })

  it('2: renders user table when admin and panel is open', async () => {
    vi.mocked(fetchAdminUsers).mockResolvedValue({ users: [ADMIN_USER, REGULAR_USER] })
    setStoreAdmin()

    render(<AdminPanel />)

    await waitFor(() => {
      expect(screen.getByTestId('admin-panel')).toBeInTheDocument()
    })
    expect(screen.getByTestId('admin-user-table')).toBeInTheDocument()
    const rows = screen.getAllByTestId('admin-user-row')
    expect(rows).toHaveLength(2)
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
  })

  it('3: shows Delete button for each user', async () => {
    vi.mocked(fetchAdminUsers).mockResolvedValue({ users: [REGULAR_USER] })
    setStoreAdmin()

    render(<AdminPanel />)

    await waitFor(() => {
      expect(screen.getByTestId('delete-button')).toBeInTheDocument()
    })
  })

  it('4: clicking Delete shows confirmation buttons', async () => {
    vi.mocked(fetchAdminUsers).mockResolvedValue({ users: [REGULAR_USER] })
    setStoreAdmin()

    render(<AdminPanel />)

    await waitFor(() => {
      expect(screen.getByTestId('delete-button')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('delete-button'))

    expect(screen.getByTestId('confirm-delete-button')).toBeInTheDocument()
    expect(screen.getByTestId('cancel-delete-button')).toBeInTheDocument()
    expect(screen.queryByTestId('delete-button')).toBeNull()
  })

  it('5: confirming delete calls deleteUser and removes user from table', async () => {
    vi.mocked(fetchAdminUsers).mockResolvedValue({ users: [REGULAR_USER] })
    vi.mocked(deleteUser).mockResolvedValue(undefined)
    setStoreAdmin()

    render(<AdminPanel />)

    await waitFor(() => {
      expect(screen.getByTestId('delete-button')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('delete-button'))
    fireEvent.click(screen.getByTestId('confirm-delete-button'))

    await waitFor(() => {
      expect(vi.mocked(deleteUser)).toHaveBeenCalledWith('user-2')
    })
    await waitFor(() => {
      expect(screen.queryByTestId('admin-user-row')).toBeNull()
    })
  })

  it('6: clicking Suspend calls suspendUser and updates the row', async () => {
    vi.mocked(fetchAdminUsers).mockResolvedValue({ users: [REGULAR_USER] })
    vi.mocked(suspendUser).mockResolvedValue({
      user: { ...REGULAR_USER, suspended: true },
    })
    setStoreAdmin()

    render(<AdminPanel />)

    await waitFor(() => {
      expect(screen.getByTestId('suspend-button')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('suspend-button'))

    await waitFor(() => {
      expect(vi.mocked(suspendUser)).toHaveBeenCalledWith('user-2')
    })
    await waitFor(() => {
      expect(screen.getByText('Suspended')).toBeInTheDocument()
    })
  })
})
