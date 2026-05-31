/**
 * Input.tsx — Controlled text input for Belibi Tennis Coaching.
 *
 * Design decisions:
 * - Focus state changes the border to primary green — gives users clear
 *   visual feedback without relying on platform defaults (which vary heavily
 *   between iOS and Android).
 * - Error message replaces hint to avoid layout height jitter — we always
 *   reserve space for one helper text line below the field.
 * - leftIcon / rightIcon props accept arbitrary React nodes so callers can
 *   pass Ionicons, custom SVGs, or even text (e.g. currency symbol) without
 *   coupling the component to one icon library.
 * - multiline support: when numberOfLines > 1, the input expands to a
 *   textarea-style field and the fixed height is removed.
 */

import React, { useState, useCallback, forwardRef } from 'react';
import {
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    TextInput,
    TextInputFocusEventData,
    TextInputProps,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { colors, radius } from '@/styles/global';
import { spacing, layout } from '@/styles/spacing';
import { typography } from '@/styles/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InputProps extends Omit<TextInputProps, 'style'> {
    /** Label rendered above the input field. */
    label?: string;
    /** Validation error string — replaces hint when non-empty. */
    error?: string;
    /** Helper text rendered below the field when there is no error. */
    hint?: string;
    /** Node rendered inside the left edge of the input (icon, prefix). */
    leftIcon?: React.ReactNode;
    /**
     * Node rendered inside the right edge of the input.
     * Automatically used for the show/hide toggle when secureTextEntry is true,
     * but callers can override by providing their own rightIcon.
     */
    rightIcon?: React.ReactNode;
    /** Whether the surrounding container occupies full width (default: true). */
    fullWidth?: boolean;
    /** Additional style applied to the outer wrapper View. */
    containerStyle?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Input = forwardRef<TextInput, InputProps>(
    (
        {
            label,
            error,
            hint,
            leftIcon,
            rightIcon,
            secureTextEntry,
            multiline,
            numberOfLines,
            fullWidth = true,
            containerStyle,
            onFocus,
            onBlur,
            ...textInputProps
        },
        ref
    ) => {
        const [isFocused, setIsFocused] = useState(false);
        // Internal toggle for password visibility — only used when secureTextEntry is true.
        const [isSecureVisible, setIsSecureVisible] = useState(false);

        const handleFocus = useCallback(
            (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
                setIsFocused(true);
                onFocus?.(e);
            },
            [onFocus]
        );

        const handleBlur = useCallback(
            (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
                setIsFocused(false);
                onBlur?.(e);
            },
            [onBlur]
        );

        const toggleSecure = useCallback(() => {
            setIsSecureVisible((prev) => !prev);
        }, []);

        // Compute border color based on state — error > focus > default.
        const borderColor = error
            ? colors.borderError
            : isFocused
            ? colors.borderFocus
            : colors.border;

        // The actual secureTextEntry prop sent to TextInput.
        const resolvedSecure = secureTextEntry ? !isSecureVisible : false;

        // Multiline fields shouldn't have a fixed height.
        const isMultiline = multiline || (numberOfLines !== undefined && numberOfLines > 1);

        return (
            <View style={[fullWidth && styles.fullWidth, containerStyle]}>
                {/* Label */}
                {label && (
                    <Text style={[styles.label, isFocused && styles.labelFocused]}>
                        {label}
                    </Text>
                )}

                {/* Input row */}
                <View
                    style={[
                        styles.inputWrapper,
                        { borderColor },
                        isMultiline && styles.multilineWrapper,
                    ]}
                >
                    {leftIcon && (
                        <View style={styles.iconLeft}>{leftIcon}</View>
                    )}

                    <TextInput
                        ref={ref}
                        style={[
                            styles.input,
                            leftIcon ? styles.inputWithLeft : undefined,
                            (rightIcon || secureTextEntry) ? styles.inputWithRight : undefined,
                            isMultiline ? styles.multilineInput : undefined,
                        ]}
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry={resolvedSecure}
                        multiline={isMultiline}
                        numberOfLines={numberOfLines}
                        // textAlignVertical ensures cursor starts at top in multiline.
                        textAlignVertical={isMultiline ? 'top' : 'center'}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        accessibilityLabel={label}
                        accessibilityHint={hint}
                        {...textInputProps}
                    />

                    {/* Right slot: caller-provided icon OR auto-generated show/hide toggle */}
                    {secureTextEntry && !rightIcon ? (
                        <TouchableOpacity
                            style={styles.iconRight}
                            onPress={toggleSecure}
                            accessibilityLabel={isSecureVisible ? 'Hide password' : 'Show password'}
                            accessibilityRole="button"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Text style={styles.secureToggleText}>
                                {isSecureVisible ? 'Hide' : 'Show'}
                            </Text>
                        </TouchableOpacity>
                    ) : rightIcon ? (
                        <View style={styles.iconRight}>{rightIcon}</View>
                    ) : null}
                </View>

                {/* Helper / error text — always occupies one line height to avoid layout shift */}
                <Text
                    style={[
                        styles.helperText,
                        error ? styles.errorText : styles.hintText,
                    ]}
                    numberOfLines={1}
                >
                    {error ?? hint ?? ' '}
                </Text>
            </View>
        );
    }
);

Input.displayName = 'Input';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    fullWidth: {
        width: '100%',
    },
    label: {
        ...typography.label,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    // Label shifts to primary color when focused — subtle but delightful.
    labelFocused: {
        color: colors.primary,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: layout.inputHeight,
        backgroundColor: colors.surfaceHigh,
        borderWidth: 1.5,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        // borderColor is set dynamically above.
    },
    multilineWrapper: {
        // Remove fixed height for multiline so the wrapper grows with content.
        height: undefined,
        minHeight: layout.inputHeight,
        alignItems: 'flex-start',
        paddingVertical: spacing.md,
    },
    input: {
        flex: 1,
        ...typography.body,
        color: colors.textPrimary,
        // Remove default padding that differs between iOS/Android.
        padding: 0,
    },
    inputWithLeft: {
        marginLeft: spacing.sm,
    },
    inputWithRight: {
        marginRight: spacing.sm,
    },
    multilineInput: {
        // Allow text to wrap and the input to grow.
        minHeight: 80,
    },
    iconLeft: {
        // Centre icon vertically in the fixed-height row.
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconRight: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    secureToggleText: {
        ...typography.label,
        color: colors.primary,
    },
    helperText: {
        ...typography.caption,
        marginTop: spacing.xs,
        minHeight: 16,
    },
    errorText: {
        color: colors.error,
    },
    hintText: {
        color: colors.textMuted,
    },
});

export default Input;
