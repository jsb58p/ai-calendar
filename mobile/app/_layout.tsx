import { ErrorUtils } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';

const originalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('GLOBAL ERROR:', error.message, error.stack);
  originalHandler(error, isFatal);
});

const queryClient = new QueryClient();

export default function RootLayout() {
  try {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0a0f' } }} />
        </QueryClientProvider>
      </GestureHandlerRootView>
    );
  } catch (e) {
    console.error('RENDER ERROR:', e);
    throw e;
  }
}
