/**
 * Badge.tsx — Status indicator chip for Belibi Tennis Coaching.
 *
 * Design decisions:
 * - Light tint background + saturated text (not the full status color as BG)
 *   prevents visual noise. On a white card with many badges, full-color
 *   backgrounds create "Christmas tree" effect; tinted backgrounds are calm.
 * - The color pairs are drawn from the global token file so they always stay
 *   in sync if the palette changes.
 * - Pill shape (borderRadius: radius.full) is a universally understood pattern
 *   for tags and labels — no ambiguity about whether it is a button.
 * - We deliberately do NOT make Badge tappable. If a badge needs to be a
 *   filter/chip, wrap it in a TouchableOpacity at the call site.
 */

import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { colors, radius } from '@/styles/global';
import { spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    size?: BadgeSize;
    style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Variant color maps
// ---------------------------------------------------------------------------

const VARIANT_COLORS: Record<
    BadgeVariant,
    { background: string; text: string }
> = {
    success: { background: colors.successTint, text: colors.success },
    warning: { background: colors.warningTint, text: colors.warning },
    error: { background: colors.errorTint, text: colors.error },
    // Blue info pair — not in the primary brand but universally understood.
    info: { background: colors.infoTint, text: colors.info },
    // Neutral grey for statuses like "Pending" or "Draft".
    neutral: { background: colors.surfaceHigh, text: colors.textSecondary },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Badge: React.FC<BadgeProps> = ({
    label,
    variant = 'neutral',
    size = 'md',
    style,
}) => {
    const { background, text } = VARIANT_COLORS[variant];

    return (
        <View
            style={[
                styles.base,
                size === 'sm' ? styles.sm : styles.md,
                { backgroundColor: background },
                style,
            ]}
            accessibilityLabel={label}
            accessibilityRole="text"
        >
            <Text
                style={[
                    styles.label,
                    size === 'sm' ? styles.labelSm : styles.labelMd,
                    { color: text },
                ]}
                numberOfLines={1}
            >
                {label}
            </Text>
        </View>
    );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    base: {
        // Pill shape — full border radius makes any rect a capsule.
        borderRadius: radius.full,
        alignSelf: 'flex-start',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sm: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
    },
    md: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    label: {
        ...typography.label,
        fontWeight: '600',
    },
    labelSm: {
        fontSize: 11,
    },
    labelMd: {
        fontSize: 12,
    },
});

export default Badge;
