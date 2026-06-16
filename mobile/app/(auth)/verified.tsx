import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Button } from '../../components/ui/Button'

export default function VerifiedScreen() {
  const router = useRouter()

  return (
    <View className="flex-1 bg-bg-base items-center justify-center px-8">

      {/* Checkmark circle */}
      <View className="w-20 h-20 rounded-full bg-success/10 border-2 border-success items-center justify-center mb-6">
        <Text style={{ color: '#22c55e', fontSize: 36, fontWeight: '700', lineHeight: 42 }}>✓</Text>
      </View>

      {/* Heading */}
      <Text className="text-text-primary text-2xl font-semibold text-center mb-2">
        Email Verified!
      </Text>

      {/* Subtext */}
      <Text className="text-text-secondary text-base text-center mb-8">
        Your account is fully verified.
      </Text>

      {/* CTA */}
      <Button
        variant="primary"
        size="lg"
        onPress={() => router.replace('/(app)/' as never)}
        className="w-full"
      >
        <Text className="text-white font-semibold text-base">Continue to App</Text>
      </Button>

      {/* Mobile note */}
      <Text className="text-text-muted text-xs text-center mt-8 leading-5">
        Already verified?{'\n'}Open the SchedulerAI app to continue.
      </Text>

    </View>
  )
}
