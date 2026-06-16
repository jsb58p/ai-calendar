import { View } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Toast } from '../../components/ui/Toast'
import { useAppStore } from '../../store/useAppStore'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

function tabIcon(name: IoniconName, focusedName: IoniconName) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? focusedName : name} color={color} size={size} />
  )
}

export default function AppLayout() {
  const toastMessage    = useAppStore((s) => s.toastMessage)
  const setToastMessage = useAppStore((s) => s.setToastMessage)
  const currentUser     = useAppStore((s) => s.currentUser)

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#111118',
            borderTopColor: '#2a2a3a',
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#5a5a72',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: tabIcon('home-outline', 'home'),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            tabBarIcon: tabIcon('calendar-outline', 'calendar'),
          }}
        />
        <Tabs.Screen
          name="goals"
          options={{
            title: 'Goals',
            tabBarIcon: tabIcon('list-outline', 'list'),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: tabIcon('settings-outline', 'settings'),
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            href: currentUser?.isAdmin ? undefined : null,
            title: 'Admin',
            tabBarIcon: tabIcon('shield-outline', 'shield'),
          }}
        />
      </Tabs>
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </View>
  )
}
