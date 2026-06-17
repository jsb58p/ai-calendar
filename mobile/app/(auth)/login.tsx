import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { login, register, resendVerification } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'
import { useGoogleAuth } from '../../hooks/useGoogleAuth'

type Mode = 'login' | 'register'

// ─── Sub-components ──────────────────────────────────────────────────────────

function InlineError({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  if (!message) return null
  return (
    <View className="bg-danger/10 border border-danger/30 rounded-xl p-3 flex-row items-start gap-2 mb-4">
      <Text className="text-danger text-sm flex-1">{message}</Text>
      <TouchableOpacity onPress={onDismiss} hitSlop={8}>
        <Text className="text-danger text-sm font-medium leading-none">✕</Text>
      </TouchableOpacity>
    </View>
  )
}

function OrDivider() {
  return (
    <View className="flex-row items-center gap-3 my-5">
      <View className="flex-1 h-px bg-border-default" />
      <Text className="text-text-muted text-xs font-mono">OR</Text>
      <View className="flex-1 h-px bg-border-default" />
    </View>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router          = useRouter()
  const currentUser     = useAppStore((s) => s.currentUser)
  const setCurrentUser  = useAppStore((s) => s.setCurrentUser)
  const setToastMessage = useAppStore((s) => s.setToastMessage)
  const { signInWithGoogle, googleEnabled } = useGoogleAuth()

  // Navigate when Google auth completes (it sets currentUser without navigating directly)
  useEffect(() => {
    if (currentUser) {
      router.replace('/(app)/' as never)
    }
  }, [currentUser])

  const [mode, setMode]                       = useState<Mode>('login')
  const [email, setEmail]                     = useState('')
  const [password, setPassword]               = useState('')
  const [displayName, setDisplayName]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState<string | null>(null)
  const [resending, setResending]             = useState(false)
  const [showPassword, setShowPassword]               = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const showUnverifiedBanner = currentUser !== null && !currentUser.emailVerified

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate(): string | null {
    if (mode === 'login') {
      if (!email.trim())  return 'Email is required'
      if (!password)      return 'Password is required'
      return null
    }
    if (!displayName.trim())                            return 'Display name is required'
    if (!email.trim())                                  return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))    return 'Enter a valid email address'
    if (password.length < 8)                            return 'Password must be at least 8 characters'
    if (password !== confirmPassword)                   return 'Passwords do not match'
    return null
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        const { user } = await login({ email, password })
        setCurrentUser(user)
        router.replace('/(app)/' as never)
      } else {
        const { user } = await register({ email, password, displayName })
        setCurrentUser(user)
        setToastMessage('Account created! Check your email to verify your address.')
        router.replace('/(app)/' as never)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    setResending(true)
    try {
      await resendVerification()
      setToastMessage('Verification email sent!')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send verification email')
    } finally {
      setResending(false)
    }
  }

  function handleGoogleSignIn() {
    signInWithGoogle().catch((err) => setError(err.message || 'Google Sign-In failed'))
  }

  function switchMode() {
    setMode((m) => (m === 'login' ? 'register' : 'login'))
    setError(null)
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 bg-bg-base">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center px-6 py-12">

            {/* ── App name ───────────────────────────────────────────────── */}
            <Text className="text-accent font-mono font-bold text-2xl text-center">
              SchedulerAI
            </Text>
            <Text className="text-text-secondary text-sm text-center mt-1 mb-8">
              {mode === 'login'
                ? 'Sign in to manage your goals'
                : 'Create an account to get started'}
            </Text>

            {/* ── Email not verified banner ───────────────────────────────── */}
            {showUnverifiedBanner && (
              <View className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-4">
                <Text className="text-warning text-sm font-medium mb-0.5">
                  Email not verified
                </Text>
                <Text className="text-warning text-xs mb-2" style={{ opacity: 0.75 }}>
                  Check your inbox for a verification link.
                </Text>
                <TouchableOpacity onPress={handleResendVerification} disabled={resending}>
                  <Text className="text-warning text-xs font-medium underline">
                    {resending ? 'Sending…' : 'Resend verification email'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Inline error ────────────────────────────────────────────── */}
            <InlineError message={error} onDismiss={() => setError(null)} />

            {/* ── Google button (only when client IDs are configured) ──────── */}
            {googleEnabled && (
              <>
                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  activeOpacity={0.85}
                  className="bg-white rounded-xl py-3.5 flex-row items-center justify-center border border-gray-200"
                  style={{ gap: 10 }}
                >
                  <Ionicons name="logo-google" size={20} color="#4285F4" />
                  <Text style={{ color: '#111827', fontWeight: '600', fontSize: 16 }}>
                    Continue with Google
                  </Text>
                </TouchableOpacity>

                <OrDivider />
              </>
            )}

            {/* ── Form fields ─────────────────────────────────────────────── */}
            <View style={{ gap: 16 }}>
              {mode === 'register' && (
                <Input
                  label="Display Name"
                  placeholder="Your name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  autoComplete="name"
                  returnKeyType="next"
                />
              )}
              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
              <Input
                label="Password"
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                returnKeyType={mode === 'register' ? 'next' : 'done'}
                onSubmitEditing={mode === 'login' ? handleSubmit : undefined}
                rightElement={
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 0,
                      bottom: 0,
                      justifyContent: 'center',
                      padding: 4,
                    }}
                    hitSlop={8}
                    activeOpacity={0.6}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#5a5a72"
                    />
                  </TouchableOpacity>
                }
              />
              {mode === 'register' && (
                <Input
                  label="Confirm Password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword((v) => !v)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: 0,
                        bottom: 0,
                        justifyContent: 'center',
                        padding: 4,
                      }}
                      hitSlop={8}
                      activeOpacity={0.6}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#5a5a72"
                      />
                    </TouchableOpacity>
                  }
                />
              )}
            </View>

            {/* ── Submit ──────────────────────────────────────────────────── */}
            <Button
              variant="primary"
              size="lg"
              onPress={handleSubmit}
              loading={loading}
              className="mt-6"
            >
              <Text className="text-white font-semibold text-base">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            </Button>

            {/* ── Mode toggle ─────────────────────────────────────────────── */}
            <TouchableOpacity onPress={switchMode} className="mt-5 items-center py-1">
              <Text className="text-text-secondary text-sm">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <Text className="text-accent font-medium">
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </Text>
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
