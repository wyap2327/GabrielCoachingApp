/**
 * LoadingSpinner.tsx — Activity indicator for Belibi Tennis Coaching.
 *
 * Design decisions:
 * - The `fullScreen` prop renders the spinner in a flex:1 container that
 *   fills its parent. This covers the two most common patterns:
 *     1. Inline spinner inside a small section (fullScreen=false)
 *     2. Full-page loading state while data fetches (fullScreen=true)
 *   rather than creating two separate components.
 * - Color defaults to primary green — the brand color signals "this is the
 *   app working" rather than a neutral grey which can look like an error.
 * - We expose a `label` prop for screen readers so VoiceOver/TalkBack users
 *   know the app is busy, not frozen.
 */

import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { colors } from '@/styles/global';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface LoadingSpinnerProps {
    size?: SpinnerSize;
    /** Spinner color — defaults to primary green. */
    color?: string;
    /**
     * When true, wraps the spinner in a flex:1 centered container so it fills
     * the available space of its parent (e.g. a full screen).
     */
    fullScreen?: boolean;
    style?: StyleProp<ViewStyle>;
    /** Accessibility label announced by screen readers. Default: "Loading". */
    accessibilityLabel?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ActivityIndicator only accepts 'small' | 'large' — map our scale to those.
function resolveNativeSize(size: SpinnerSize): 'small' | 'large' | number {
    if (size === 'sm') return 'small';
    if (size === 'lg') return 'large';
    // 'md' sits between the two native sizes — use a numeric value.
    return 28;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    color = colors.primary,
    fullScreen = false,
    style,
    accessibilityLabel = 'Loading',
}) => {
    const spinner = (
        <ActivityIndicator
            size={resolveNativeSize(size)}
            color={color}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="progressbar"
            // accessibilityState busy tells assistive tech this is temporary.
            accessibilityState={{ busy: true }}
        />
    );

    if (fullScreen) {
        return (
            <View style={[styles.fullScreen, style]}>
                {spinner}
            </View>
        );
    }

    return (
        <View style={[styles.inline, style]}>
            {spinner}
        </View>
    );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
    inline: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default LoadingSpinner;
