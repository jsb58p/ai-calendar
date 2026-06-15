import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import { useAppStore } from '../../store/useAppStore'
import {
  fetchAdminUsers,
  deleteUser,
  suspendUser,
  resetUserPassword,
  toggleUserAdmin,
  type AdminUser,
} from '../../api/client'

export function AdminPanel() {
  const currentUser      = useAppStore((s) => s.currentUser)
  const isOpen           = useAppStore((s) => s.isAdminPanelOpen)
  const setAdminPanelOpen = useAppStore((s) => s.setAdminPanelOpen)

  const [users, setUsers]         = useState<AdminUser[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !currentUser?.isAdmin) return
    setLoading(true)
    setError(null)
    fetchAdminUsers()
      .then(({ users: u }) => setUsers(u))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load users'))
      .finally(() => setLoading(false))
  }, [isOpen, currentUser?.isAdmin])

  if (!currentUser?.isAdmin) return null

  async function handleDelete(userId: string) {
    await deleteUser(userId)
    setUsers((prev) => prev.filter((u) => u.id !== userId))
    setConfirmDeleteId(null)
  }

  async function handleSuspend(userId: string) {
    const { user: updated } = await suspendUser(userId)
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
  }

  async function handleResetPassword(userId: string) {
    await resetUserPassword(userId)
  }

  async function handleToggleAdmin(userId: string) {
    const { user: updated } = await toggleUserAdmin(userId)
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setAdminPanelOpen(false)}
      title="Admin Panel"
      panelTestId="admin-panel"
    >
      {loading && (
        <p data-testid="admin-loading" style={{ color: '#9090aa', fontSize: '14px' }}>
          Loading users…
        </p>
      )}

      {error && (
        <p data-testid="admin-error" style={{ color: '#f87171', fontSize: '14px' }}>
          {error}
        </p>
      )}

      {!loading && !error && users.length === 0 && (
        <p data-testid="admin-empty" style={{ color: '#9090aa', fontSize: '14px' }}>
          No users found.
        </p>
      )}

      {!loading && users.length > 0 && (
        <table data-testid="admin-user-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ color: '#9090aa', textAlign: 'left', borderBottom: '1px solid #2a2a3a' }}>
              <th style={{ padding: '8px 0' }}>User</th>
              <th style={{ padding: '8px 0' }}>Goals</th>
              <th style={{ padding: '8px 0' }}>Status</th>
              <th style={{ padding: '8px 0' }}>Joined</th>
              <th style={{ padding: '8px 0' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                data-testid="admin-user-row"
                style={{ borderBottom: '1px solid #1e1e2a' }}
              >
                <td style={{ padding: '10px 0' }}>
                  <div style={{ color: '#e0e0f0', fontWeight: 500 }}>{user.displayName}</div>
                  <div style={{ color: '#9090aa', fontSize: '12px' }}>{user.email}</div>
                </td>
                <td style={{ padding: '10px 0', color: '#9090aa' }}>{user.goalCount}</td>
                <td style={{ padding: '10px 0' }}>
                  {user.isAdmin && (
                    <span style={{ color: '#a78bfa', fontSize: '11px', fontWeight: 600, marginRight: '6px' }}>
                      ADMIN
                    </span>
                  )}
                  {user.suspended ? (
                    <span style={{ color: '#f87171', fontSize: '11px' }}>Suspended</span>
                  ) : (
                    <span style={{ color: '#4ade80', fontSize: '11px' }}>Active</span>
                  )}
                </td>
                <td style={{ padding: '10px 0', color: '#9090aa', fontSize: '12px' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '10px 0' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      data-testid="suspend-button"
                      onClick={() => void handleSuspend(user.id)}
                      style={{ background: '#22222e', border: '1px solid #2a2a3a', borderRadius: '4px', padding: '3px 8px', color: '#f59e0b', cursor: 'pointer', fontSize: '12px' }}
                    >
                      {user.suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                    <button
                      data-testid="reset-password-button"
                      onClick={() => void handleResetPassword(user.id)}
                      style={{ background: '#22222e', border: '1px solid #2a2a3a', borderRadius: '4px', padding: '3px 8px', color: '#9090aa', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Reset PW
                    </button>
                    <button
                      data-testid="toggle-admin-button"
                      onClick={() => void handleToggleAdmin(user.id)}
                      style={{ background: '#22222e', border: '1px solid #2a2a3a', borderRadius: '4px', padding: '3px 8px', color: '#a78bfa', cursor: 'pointer', fontSize: '12px' }}
                    >
                      {user.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                    {confirmDeleteId === user.id ? (
                      <>
                        <button
                          data-testid="confirm-delete-button"
                          onClick={() => void handleDelete(user.id)}
                          style={{ background: '#7f1d1d', border: '1px solid #ef4444', borderRadius: '4px', padding: '3px 8px', color: '#fca5a5', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Confirm
                        </button>
                        <button
                          data-testid="cancel-delete-button"
                          onClick={() => setConfirmDeleteId(null)}
                          style={{ background: '#22222e', border: '1px solid #2a2a3a', borderRadius: '4px', padding: '3px 8px', color: '#9090aa', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        data-testid="delete-button"
                        onClick={() => setConfirmDeleteId(user.id)}
                        style={{ background: '#22222e', border: '1px solid #ef4444', borderRadius: '4px', padding: '3px 8px', color: '#f87171', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  )
}
