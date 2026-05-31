/**
 * login.tsx — Entry point for signed-out users.
 *
 * Layout: KeyboardAvoidingView wraps everything so the form scrolls up
 * when the keyboard appears, keeping the Sign In button visible.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { colors } from '@/styles/global';
import { typography } from '@/styles/typography';
import { spacing } from '@/styles/spacing';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // inline error, not a modal

  async function handleSignIn() {
    // Clear any previous error before a new attempt.
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email.trim(), password);
    setIsLoading(false);

    if (error) {
      // Supabase returns technical messages — show something friendlier.
      setErrorMessage('Incorrect email or password. Please try again.');
    }
    // On success, the useAuth listener in _layout.tsx detects the new session
    // and automatically navigates to /(tabs). No manual redirect needed here.
  }

  return (
    // behavior="padding" on iOS shifts the view up by the keyboard height.
    // Android handles this automatically via windowSoftInputMode in the manifest.
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled" // tapping outside keyboard doesn't block button press
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo area ── */}
        <View style={styles.logoArea}>
          <Text style={styles.appName}>Belibi</Text>
          <Text style={styles.appSubtitle}>Tennis Coaching</Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.form}>
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
            placeholder="Your password"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSignIn} // pressing Done on keyboard triggers sign in
          />

          {/* Inline error — appears between password field and button */}
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <Button
            label="Sign In"
            onPress={handleSignIn}
            fullWidth
            loading={isLoading}
            style={styles.signInButton}
          />

          {/* Forgot password link */}
          <TouchableOpacity
            onPress={() => router.push('/auth/forgot-password')}
            style={styles.forgotLink}
            accessibilityRole="link"
            accessibilityLabel="Forgot password"
          >
            <Text style={styles.linkText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* ── Register link at bottom ── */}
        <View style={styles.registerRow}>
          <Text style={styles.registerPrompt}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => router.push('/auth/register')}
            accessibilityRole="link"
            accessibilityLabel="Go to register screen"
          >
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1, // allows ScrollView content to expand to fill space when content is short
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },

  // ── Logo ──
  logoArea: {
    alignItems: 'center',
    marginBottom: spacing.xxl * 1.5,
  },
  appName: {
    ...typography.display,
    color: colors.primary,
    letterSpacing: -1,
  },
  appSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Form ──
  form: {
    width: '100%',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.sm,
    // Slight indent to align visually with input labels.
    marginLeft: 2,
  },
  signInButton: {
    marginTop: spacing.sm,
  },
  forgotLink: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.xs, // extra touch target height
  },
  linkText: {
    ...typography.body,
    color: colors.primary,
  },

  // ── Register row ──
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  registerPrompt: {
    ...typography.body,
    color: colors.textSecondary,
  },
  registerLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
