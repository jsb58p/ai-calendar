import { useEffect, useRef } from 'react'
import { Animated, Text, TouchableOpacity } from 'react-native'

interface Props {
  message: string | null
  onDismiss: () => void
}

export function Toast({ message, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(100)).current
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current)

    if (message) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start()

      dismissTimer.current = setTimeout(() => {
        slideOut()
      }, 6000)
    } else {
      slideOut()
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current)
    }
  }, [message])

  function slideOut() {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }

  function handleDismiss() {
    if (dismissTimer.current) clearTimeout(dismissTimer.current)
    slideOut()
    setTimeout(onDismiss, 250)
  }

  if (!message) return null

  return (
    <Animated.View
      style={{ transform: [{ translateY }] }}
      className="absolute bottom-6 left-4 right-4 bg-bg-elevated border border-border-default rounded-xl px-4 py-3 flex-row items-center justify-between shadow-lg"
    >
      <Text className="text-text-primary text-sm flex-1 mr-3">{message}</Text>
      <TouchableOpacity onPress={handleDismiss} hitSlop={8}>
        <Text className="text-text-muted text-lg leading-none">✕</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}
