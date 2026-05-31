/**
 * Button.tsx — Primary interactive element for Belibi Tennis Coaching.
 *
 * Design decisions:
 * - Four variants cover 95% of use cases without one-off overrides:
 *     primary  → filled green  (main CTAs)
 *     secondary→ outlined green (secondary actions)
 *     ghost    → text-only green (tertiary / destructive avoidance)
 *     danger   → filled red (delete, cancel booking)
 * - Three sizes map to our layout.buttonHeight tokens so buttons always
 *   align to the 4-point grid.
 * - Loading state replaces label + icons with ActivityIndicator so the
 *   button doesn't resize during async operations (avoids layout shift).
 * - Disabled state uses 40% opacity — enough to signal unavailability
 *   without requiring variant-specific disabled colors.
 */

import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
    TextStyle,
    StyleProp,
} from 'react-native';
import { colors, radius } from '@/styles/global';
import { spacing, layout } from '@/styles/spacing';
import { typography } from '@/styles/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
    /** Text label displayed inside the button. */
    label: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** When true, button spans full available width. */
    fullWidth?: boolean;
    /** Renders ActivityIndicator instead of label; onPress is blocked. */
    loading?: boolean;
    /** Visually and functionally disables the button. */
    disabled?: boolean;
    /** React node rendered to the left of the label (e.g. <Ionicons />). */
    leftIcon?: React.ReactNode;
    /** React node rendered to the right of the label. */
    rightIcon?: React.ReactNode;
    /** Additional styles applied to the outer TouchableOpacity. */
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
    accessibilityHint?: string;
}

// ---------------------------------------------------------------------------
// Variant style maps — derived at module load time, not inside render.
// ---------------------------------------------------------------------------

const containerVariantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
        backgroundColor: colors.primary,
        borderWidth: 0,
    },
    secondary: {
        backgroundColor: colors.transparent,
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    ghost: {
        backgroundColor: colors.transparent,
        borderWidth: 0,
    },
    danger: {
        backgroundColor: colors.error,
        borderWidth: 0,
    },
};

const textVariantStyles: Record<ButtonVariant, TextStyle> = {
    primary: { color: colors.textInverse },
    secondary: { color: colors.primary },
    ghost: { color: colors.primary },
    danger: { color: colors.textInverse },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
    sm: {
        container: {
            height: layout.buttonHeight.sm,
            paddingHorizontal: spacing.md,
            borderRadius: radius.sm,
        },
        text: {
            fontSize: 13,
            fontWeight: '600',
        },
    },
    md: {
        container: {
            height: layout.buttonHeight.md,
            paddingHorizontal: spacing.xl,
            borderRadius: radius.md,
        },
        text: {
            fontSize: 15,
            fontWeight: '600',
        },
    },
    lg: {
        container: {
            height: layout.buttonHeight.lg,
            paddingHorizontal: spacing.xxl,
            borderRadius: radius.lg,
        },
        text: {
            fontSize: 17,
            fontWeight: '600',
        },
    },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Button: React.FC<ButtonProps> = ({
    label,
    onPress,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    style,
    accessibilityLabel,
    accessibilityHint,
}) => {
    // Memoised so the reference stays stable across parent re-renders.
    const handlePress = useCallback(() => {
        if (!loading && !disabled) onPress();
    }, [loading, disabled, onPress]);

    const isDisabled = disabled || loading;

    const containerStyle: ViewStyle[] = [
        styles.base,
        containerVariantStyles[variant],
        sizeStyles[size].container,
        fullWidth ? styles.fullWidth : {},
        isDisabled ? styles.disabled : {},
    ];

    // Spinner color adapts to the variant so it's always visible.
    const spinnerColor =
        variant === 'primary' || variant === 'danger'
            ? colors.textInverse
            : colors.primary;

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={isDisabled}
            activeOpacity={0.75}
            style={[containerStyle, style]}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled: isDisabled, busy: loading }}
        >
            {loading ? (
                // Show spinner centred — don't render icons/label during load.
                <ActivityIndicator
                    size="small"
                    color={spinnerColor}
                    accessibilityLabel="Loading"
                />
            ) : (
                <View style={styles.content}>
                    {leftIcon && (
                        <View style={styles.iconLeft}>{leftIcon}</View>
                    )}
                    <Text
                        style={[
                            styles.label,
                            textVariantStyles[variant],
                            sizeStyles[size].text,
                        ]}
                        numberOfLines={1}
                    >
                        {label}
                    </Text>
                    {rightIcon && (
                        <View style={styles.iconRight}>{rightIcon}</View>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        // Overflow hidden ensures border-radius clips any child backgrounds.
        overflow: 'hidden',
    },
    fullWidth: {
        alignSelf: 'stretch',
    },
    // 40% opacity is a widely recognised disabled visual pattern.
    disabled: {
        opacity: 0.4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconLeft: {
        marginRight: spacing.sm,
    },
    iconRight: {
        marginLeft: spacing.sm,
    },
    label: {
        // Base label styles — variant and size overrides are merged at render time.
        ...typography.body,
        fontWeight: '600',
        letterSpacing: 0.1,
    },
});

export default Button;
