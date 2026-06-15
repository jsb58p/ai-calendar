import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#f0f0ff', fontSize: 24, fontWeight: '600', letterSpacing: -0.5 }}>
        SchedulerAI
      </Text>
      <Text style={{ color: '#9090aa', fontSize: 14, marginTop: 8 }}>
        Mobile app coming soon
      </Text>
      <StatusBar style="light" />
    </View>
  );
}
