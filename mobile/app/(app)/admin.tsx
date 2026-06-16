import { useEffect, useState } from 'react'
import {
  Alert,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Header } from '../../components/Header'
import { ScreenWrapper } from '../../components/ScreenWrapper'
import {
  fetchAdminUsers,
  suspendUser,
  resetUserPassword,
  toggleUserAdmin,
  deleteUser,
} from '../../api/client'
import type { AdminUser } from '../../types'

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ user }: { user: AdminUser }) {
  let label  = 'Active'
  let color  = '#22c55e'
  let bg     = 'rgba(34,197,94,0.1)'
  let border = 'rgba(34,197,94,0.3)'

  if (user.isAdmin) {
    label  = 'Admin'
    color  = '#6366f1'
    bg     = 'rgba(99,102,241,0.1)'
    border = 'rgba(99,102,241,0.3)'
  }
  if (user.suspended) {
    label  = 'Suspended'
    color  = '#ef4444'
    bg     = 'rgba(239,68,68,0.1)'
    border = 'rgba(239,68,68,0.3)'
  }

  return (
    <View
      style={{
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 3,
      }}
    >
      <Text style={{ color, fontSize: 11, fontWeight: '500' }}>{label}</Text>
    </View>
  )
}

function UserCard({
  user,
  onRefresh,
}: {
  user: AdminUser
  onRefresh: () => Promise<void>
}) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  async function runAction(key: string, fn: () => Promise<void>) {
    setLoadingKey(key)
    try {
      await fn()
      await onRefresh()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Action failed')
    } finally {
      setLoadingKey(null)
    }
  }

  function handleSuspend() {
    runAction('suspend', async () => { await suspendUser(user.id) })
  }

  function handleResetPW() {
    runAction('resetpw', async () => {
      await resetUserPassword(user.id)
      Alert.alert('Password Reset', `A reset email has been sent to ${user.email}.`)
    })
  }

  function handleToggleAdmin() {
    runAction('admin', async () => { await toggleUserAdmin(user.id) })
  }

  function handleDelete() {
    Alert.alert(
      'Delete User',
      `Delete ${user.displayName}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => runAction('delete', () => deleteUser(user.id)),
        },
      ]
    )
  }

  const busy = loadingKey !== null

  const actions = [
    {
      key:    'suspend',
      label:  user.suspended ? 'Unsuspend' : 'Suspend',
      color:  user.suspended ? '#22c55e' : '#f59e0b',
      bg:     user.suspended ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
      border: user.suspended ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)',
      onPress: handleSuspend,
    },
    {
      key:    'resetpw',
      label:  'Reset PW',
      color:  '#8888a8',
      bg:     '#1e1e2e',
      border: '#2a2a3a',
      onPress: handleResetPW,
    },
    {
      key:    'admin',
      label:  user.isAdmin ? 'Revoke Admin' : 'Make Admin',
      color:  '#6366f1',
      bg:     'rgba(99,102,241,0.1)',
      border: 'rgba(99,102,241,0.3)',
      onPress: handleToggleAdmin,
    },
    {
      key:    'delete',
      label:  'Delete',
      color:  '#ef4444',
      bg:     'rgba(239,68,68,0.1)',
      border: 'rgba(239,68,68,0.3)',
      onPress: handleDelete,
    },
  ]

  return (
    <View
      style={{
        backgroundColor: '#16162a',
        borderWidth: 1,
        borderColor: '#2a2a3a',
        borderRadius: 14,
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      {/* ── Info ─────────────────────────────────────────────────────────── */}
      <View style={{ padding: 14 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text
              style={{ color: '#f0f0ff', fontWeight: '600', fontSize: 15 }}
              numberOfLines={1}
            >
              {user.displayName}
            </Text>
            <Text
              style={{ color: '#8888a8', fontSize: 12, marginTop: 2 }}
              numberOfLines={1}
            >
              {user.email}
            </Text>
          </View>
          <StatusBadge user={user} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: '#1e1e2e',
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: '#5a5a72', fontSize: 11 }}>Goals</Text>
            <Text style={{ color: '#f0f0ff', fontSize: 11, fontWeight: '600' }}>
              {user.goalCount}
            </Text>
          </View>
          <Text style={{ color: '#5a5a72', fontSize: 11, fontFamily: 'monospace' }}>
            Joined {joinDate}
          </Text>
        </View>
      </View>

      {/* ── Action row ───────────────────────────────────────────────────── */}
      <View style={{ borderTopWidth: 1, borderTopColor: '#2a2a3a' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}
        >
          {actions.map((action) => {
            const isThisLoading = loadingKey === action.key
            return (
              <TouchableOpacity
                key={action.key}
                onPress={action.onPress}
                disabled={busy}
                activeOpacity={0.75}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: action.bg,
                  borderWidth: 1,
                  borderColor: action.border,
                  opacity: busy && !isThisLoading ? 0.4 : 1,
                }}
              >
                <Text style={{ color: action.color, fontSize: 12, fontWeight: '500' }}>
                  {isThisLoading ? '…' : action.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const [users,     setUsers]     = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  async function loadUsers() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchAdminUsers()
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const countBadge =
    !isLoading && users.length > 0 ? (
      <View
        style={{
          backgroundColor: '#6366f1',
          borderRadius: 999,
          paddingHorizontal: 8,
          paddingVertical: 2,
          minWidth: 28,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
          {users.length}
        </Text>
      </View>
    ) : undefined

  return (
    <>
      <Header title="Admin Panel" rightAction={countBadge} />
      <ScreenWrapper>
        {isLoading ? (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#5a5a72', fontSize: 14 }}>Loading users…</Text>
          </View>
        ) : error ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 32,
              gap: 16,
            }}
          >
            <Text
              style={{ color: '#ef4444', fontSize: 14, textAlign: 'center' }}
            >
              {error}
            </Text>
            <TouchableOpacity
              onPress={loadUsers}
              activeOpacity={0.75}
              style={{
                backgroundColor: '#1e1e2e',
                borderWidth: 1,
                borderColor: '#2a2a3a',
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: '#8888a8', fontSize: 13 }}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(u) => u.id}
            renderItem={({ item }) => (
              <UserCard user={item} onRefresh={loadUsers} />
            )}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#5a5a72', fontSize: 14 }}>
                  No users found.
                </Text>
              </View>
            }
          />
        )}
      </ScreenWrapper>
    </>
  )
}
