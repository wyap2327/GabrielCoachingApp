import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    // headerShown: false — we draw our own back buttons and titles in each
    // auth screen to match the app's design system rather than the default
    // native navigation bar style.
    <Stack screenOptions={{ headerShown: false }} />
  );
}
