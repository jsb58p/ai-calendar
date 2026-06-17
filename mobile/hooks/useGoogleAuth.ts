import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import * as SecureStore from 'expo-secure-store'
import { useAppStore } from '../store/useAppStore'
import { apiClient } from '../api/client'

const webClientId   = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? ''
const googleEnabled = webClientId.length > 0

if (googleEnabled) {
  GoogleSignin.configure({
    webClientId,
    scopes: ['openid', 'email', 'profile'],
    offlineAccess: false,
  })
}

export function useGoogleAuth() {
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  async function signInWithGoogle() {
    if (!googleEnabled) return
    try {
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      const tokens   = await GoogleSignin.getTokens()
      const res = await apiClient.post('/auth/users/google/mobile', { accessToken: tokens.accessToken })
      await SecureStore.setItemAsync('auth_token', res.data.token)
      setCurrentUser(res.data.user)
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled — no-op
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // already in progress — no-op
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available on this device')
      } else {
        console.error('Google sign-in error:', error)
        throw error
      }
    }
  }

  async function signOut() {
    try {
      await GoogleSignin.signOut()
    } catch (error) {
      console.error('Google sign out error:', error)
    }
  }

  return { signInWithGoogle, googleEnabled, signOut }
}
