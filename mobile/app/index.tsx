import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useRouter } from 'expo-router'
import { getMe } from '../api/client'
import { useAppStore } from '../store/useAppStore'

export default function Index() {
  const { isAuthenticated, authLoading, setCurrentUser, setAuthLoading } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    getMe()
      .then(({ user }) => setCurrentUser(user))
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (isAuthenticated) {
      router.replace('/(app)/' as never)
    } else {
      router.replace('/(auth)/login')
    }
  }, [authLoading, isAuthenticated])

  return (
    <View className="flex-1 bg-bg-base items-center justify-center">
      <ActivityIndicator color="#6366f1" size="large" />
    </View>
  )
}
