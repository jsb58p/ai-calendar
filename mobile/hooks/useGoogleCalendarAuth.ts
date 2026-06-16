import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import * as SecureStore from 'expo-secure-store'
import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { connectGoogleCalendarMobile } from '../api/client'

WebBrowser.maybeCompleteAuthSession()

const STORAGE_KEY = 'google_calendar_tokens'

export function useGoogleCalendarAuth() {
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? ''
  const webClientId     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''
  const calendarEnabled = androidClientId.length > 0 && webClientId.length > 0

  const setGoogleTokens = useAppStore((s) => s.setGoogleTokens)
  const googleTokens    = useAppStore((s) => s.googleTokens)

  // Restore tokens from SecureStore on mount
  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          const tokens = JSON.parse(stored) as { access_token: string; refresh_token: string }
          setGoogleTokens(tokens)
        } catch {
          // corrupt data — ignore
        }
      }
    })
  }, [])

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: androidClientId || 'placeholder',
    webClientId:     webClientId     || 'placeholder',
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    extraParams: { access_type: 'offline', prompt: 'consent' },
  })

  useEffect(() => {
    if (!calendarEnabled) return
    if (response?.type === 'success' && response.authentication?.accessToken) {
      handleConnect(
        response.authentication.accessToken,
        response.authentication.refreshToken ?? ''
      )
    }
  }, [response, calendarEnabled])

  async function handleConnect(accessToken: string, refreshToken: string) {
    try {
      const tokens = await connectGoogleCalendarMobile(accessToken, refreshToken)
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(tokens))
      setGoogleTokens(tokens)
    } catch (err) {
      console.error('Google Calendar connect error:', err)
    }
  }

  async function disconnect() {
    await SecureStore.deleteItemAsync(STORAGE_KEY)
    setGoogleTokens(null)
  }

  return {
    promptAsync,
    request,
    calendarEnabled,
    isConnected: !!googleTokens,
    disconnect,
  }
}
