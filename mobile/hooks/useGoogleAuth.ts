import { useEffect } from 'react'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import * as SecureStore from 'expo-secure-store'
import { apiClient } from '../api/client'
import { useAppStore } from '../store/useAppStore'
import type { CurrentUser } from '../types'

WebBrowser.maybeCompleteAuthSession()

export function useGoogleAuth() {
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  const webClientId     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  const googleEnabled   = !!androidClientId && !!webClientId

  const [request, response, promptAsync] = Google.useAuthRequest(
    googleEnabled
      ? { androidClientId, webClientId, scopes: ['openid', 'email', 'profile'] }
      : null
  )

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response
      if (authentication?.accessToken) {
        exchangeGoogleToken(authentication.accessToken)
      }
    }
  }, [response])

  async function exchangeGoogleToken(accessToken: string) {
    try {
      const res = await apiClient.post<{ user: CurrentUser; token: string }>(
        '/auth/users/google/mobile',
        { accessToken }
      )
      await SecureStore.setItemAsync('auth_token', res.data.token)
      setCurrentUser(res.data.user)
    } catch (err) {
      console.error('Google sign-in error:', err)
    }
  }

  return { promptAsync, request, googleEnabled }
}
