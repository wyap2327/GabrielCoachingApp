// ROOT LAYOUT — src/app/_layout.tsx
// Wraps the entire app. Handles auth guard and redirects.
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function RootLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments(); // current URL segments, e.g. ['auth', 'login'] or ['(tabs)']

  useEffect(() => {
    if (isLoading) return; // wait until we know the auth state before redirecting

    // `segments[0]` tells us which route group we're in.
    // If the user is not logged in and they're NOT already on an auth screen, send them to login.
    // If the user IS logged in and they're on an auth screen, send them home.
    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Not logged in — force to login screen.
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Already logged in — skip the auth flow and go straight to the app.
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  // Show full-screen spinner while we check AsyncStorage for a saved session.
  // Without this, there's a flash of the wrong screen on startup.
  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Light mode app — dark status bar text on white headers */}
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
