/**
 * register.tsx — New account creation screen.
 *
 * Validates that passwords match before sending the request to Supabase,
 * so we avoid an unnecessary network call for a mistake the app can catch.
 */

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/styles/global';
import { spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleRegister() {
    setErrorMessage('');

    // Client-side validation — catch obvious mistakes before hitting the network.
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      // Supabase requires a minimum of 6 characters by default.
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email.trim(), password, name.trim());
    setIsLoading(false);

    if (error) {
      // Common case: the email is already registered.
      if (error.message.toLowerCase().includes('already registered')) {
        setErrorMessage('An account with this email already exists.');
      } else {
        setErrorMessage(error.message);
      }
      return;
    }

    // Supabase sends a confirmation email by default. Let the user know.
    // Once they confirm, they can sign in. The _layout.tsx auth guard will
    // redirect them automatically when the session is established.
    router.replace('/auth/login');
  }

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header with back button ── */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            {/* Spacer keeps the title centred. Same width as the back button. */}
            <View style={styles.headerSpacer} />
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Gabriel Silva"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              returnKeyType="next"
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat your password"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <Button
              label="Create Account"
              onPress={handleRegister}
              fullWidth
              loading={isLoading}
              style={styles.submitButton}
            />
          </View>

          {/* ── Sign in link ── */}
          <View style={styles.signInRow}>
            <Text style={styles.signInPrompt}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="link"
              accessibilityLabel="Go to sign in screen"
            >
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: colors.primary,
  },
  title: {
    ...typography.h2,
  },
  // Same width as back button so the title stays centred between them.
  headerSpacer: {
    width: 40,
  },

  // ── Form ──
  form: {
    width: '100%',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  submitButton: {
    marginTop: spacing.sm,
  },

  // ── Sign in row ──
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  signInPrompt: {
    ...typography.body,
    color: colors.textSecondary,
  },
  signInLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
