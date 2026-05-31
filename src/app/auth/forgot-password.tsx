/**
 * forgot-password.tsx — Password reset screen.
 *
 * Supabase sends an email with a reset link. The app doesn't need to handle
 * the link directly — the user clicks it in their email client, sets a new
 * password on the Supabase-hosted page, then comes back and signs in.
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { resetPassword } from '@/lib/auth';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { colors } from '@/styles/global';
import { typography } from '@/styles/typography';
import { spacing } from '@/styles/spacing';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // When true, we hide the form and show a confirmation message instead.
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSendReset() {
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(email.trim());
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    // Switch to success state — form is no longer needed.
    setIsSuccess(true);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back to sign in"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Reset Password</Text>
          <View style={styles.headerSpacer} />
        </View>

        {isSuccess ? (
          // ── Success state — form replaced by confirmation message ──
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successBody}>
              We've sent a password reset link to{' '}
              <Text style={styles.successEmail}>{email}</Text>.
              {'\n\n'}
              Open the link in the email to set a new password, then come back
              and sign in.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/auth/login')}
              style={styles.backToSignIn}
              accessibilityRole="link"
            >
              <Text style={styles.backToSignInText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ── Form state ──
          <View style={styles.form}>
            <Text style={styles.description}>
              Enter your email address and we'll send you a link to reset your
              password.
            </Text>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSendReset}
            />

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <Button
              label="Send Reset Link"
              onPress={handleSendReset}
              fullWidth
              loading={isLoading}
              style={styles.sendButton}
            />

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.cancelLink}
              accessibilityRole="link"
              accessibilityLabel="Back to sign in"
            >
              <Text style={styles.cancelLinkText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
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
  headerSpacer: {
    width: 40,
  },

  // ── Form ──
  form: {
    width: '100%',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  sendButton: {
    marginTop: spacing.sm,
  },
  cancelLink: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.xs,
  },
  cancelLinkText: {
    ...typography.body,
    color: colors.primary,
  },

  // ── Success state ──
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  successIcon: {
    fontSize: 56,
    color: colors.success,
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  successBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  successEmail: {
    color: colors.primary,
    fontWeight: '600',
  },
  backToSignIn: {
    marginTop: spacing.xxl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  backToSignInText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
