/**
 * EmptyState.tsx — Zero-data placeholder for Belibi Tennis Coaching.
 *
 * Design decisions:
 * - Every list and feed screen must handle the empty state explicitly.
 *   This component enforces a consistent visual language so "no data" never
 *   looks like a bug — it looks intentional and helpful.
 * - The icon prop accepts a string emoji OR a React node so callers can pass
 *   either a quick emoji (prototyping) or a proper Ionicons element (production).
 * - An optional CTA button guides the user to the next action rather than
 *   leaving them stranded. Example: "No sessions booked — Book a session".
 * - The layout is vertically centred and padded so it works whether it is
 *   placed inside a full-screen flex:1 container or inside a smaller list area.
 */

import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { colors } from '@/styles/global';
import { spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { Button } from './Button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmptyStateProps {
    /** Emoji string (e.g. "🎾") or a React node (e.g. <Ionicons name="calendar-outline" />) */
    icon?: React.ReactNode | string;
    title: string;
    /** Supporting text below the title — explain why it's empty or what to do next. */
    description?: string;
    /** Label for the optional action button. */
    actionLabel?: string;
    onAction?: () => void;
    style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    style,
}) => {
    return (
        <View style={[styles.container, style]} accessibilityRole="none">
            {icon !== undefined && (
                <View style={styles.iconWrapper}>
                    {typeof icon === 'string' ? (
                        // Emoji icons — render large so they read as an illustration.
                        <Text style={styles.emojiIcon}>{icon}</Text>
                    ) : (
                        // React node (Ionicons, etc.) — the caller controls the size.
                        icon
                    )}
                </View>
            )}

            <Text style={styles.title} accessibilityRole="header">
                {title}
            </Text>

            {description && (
                <Text style={styles.description}>{description}</Text>
            )}

            {actionLabel && onAction && (
                <Button
                    label={actionLabel}
                    onPress={onAction}
                    variant="primary"
                    size="md"
                    style={styles.button}
                />
            )}
        </View>
    );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xxl,
        paddingVertical: spacing.xxxl,
    },
    iconWrapper: {
        marginBottom: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Large emoji illustration — 56px feels like a small hero icon.
    emojiIcon: {
        fontSize: 56,
        textAlign: 'center',
    },
    title: {
        ...typography.h3,
        textAlign: 'center',
        marginBottom: spacing.sm,
        color: colors.textPrimary,
    },
    description: {
        ...typography.body,
        textAlign: 'center',
        color: colors.textSecondary,
        // Constrain line length for readability — no more than ~45 chars per line.
        maxWidth: 280,
    },
    button: {
        marginTop: spacing.xl,
        // Min width ensures the button doesn't collapse on short labels.
        minWidth: 160,
    },
});

export default EmptyState;
