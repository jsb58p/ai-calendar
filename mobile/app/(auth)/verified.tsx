import { Text, View } from 'react-native'
import { Link } from 'expo-router'
import { Button } from '../../components/ui/Button'

export default function VerifiedScreen() {
  return (
    <View className="flex-1 bg-bg-base items-center justify-center px-6">
      <Text className="text-4xl mb-4">✓</Text>
      <Text className="text-text-primary text-xl font-semibold text-center">
        Email verified!
      </Text>
      <Text className="text-text-secondary text-sm text-center mt-2 mb-8">
        Your account is ready. Sign in to get started.
      </Text>
      <Link href="/(auth)/login" asChild>
        <Button variant="primary" size="lg">Sign in</Button>
      </Link>
    </View>
  )
}
