import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import * as SecureStore from 'expo-secure-store'
import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { apiClient } from '../api/client'

WebBrowser.maybeCompleteAuthSession()

export function useGoogleAuth() {
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? ''
  const webClientId     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''
  const googleEnabled   = androidClientId.length > 0 && webClientId.length > 0

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: androidClientId || 'placeholder',
    webClientId:     webClientId     || 'placeholder',
    scopes: ['openid', 'email', 'profile'],
  })
  console.log('Redirect URI:', request?.redirectUri)

  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  useEffect(() => {
    if (!googleEnabled) return
    if (response?.type === 'success' && response.authentication?.accessToken) {
      exchangeGoogleToken(response.authentication.accessToken)
    }
  }, [response, googleEnabled])

  async function exchangeGoogleToken(accessToken: string) {
    try {
      const res = await apiClient.post('/auth/users/google/mobile', { accessToken })
      await SecureStore.setItemAsync('auth_token', res.data.token)
      setCurrentUser(res.data.user)
    } catch (err) {
      console.error('Google sign-in error:', err)
    }
  }

  return { promptAsync, request, googleEnabled }
}
