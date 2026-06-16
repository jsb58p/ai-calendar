import { useEffect, useRef, useState } from 'react'
import { Animated, Text, TouchableOpacity, View } from 'react-native'

interface Props {
  message: string | null
  onDismiss: () => void
}

export function ErrorBanner({ message, onDismiss }: Props) {
  const opacity = useRef(new Animated.Value(0)).current
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (message) {
      setVisible(true)
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start()
    } else {
      slideOut()
    }
  }, [message])

  function slideOut() {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setVisible(false))
  }

  function handleDismiss() {
    slideOut()
    setTimeout(onDismiss, 150)
  }

  if (!visible) return null

  return (
    <Animated.View style={{ opacity }} className="mx-4 mb-2">
      <View className="bg-danger/10 border border-danger/30 rounded-xl p-3 flex-row items-center justify-between">
        <Text className="text-danger text-sm flex-1 mr-3">{message}</Text>
        <TouchableOpacity onPress={handleDismiss} hitSlop={8}>
          <Text className="text-danger text-base leading-none font-medium">✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}
