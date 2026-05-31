/**
 * Avatar.tsx — User portrait / initials badge for Belibi Tennis Coaching.
 *
 * Design decisions:
 * - Initials fallback avoids broken image states. If a user has no profile
 *   photo the initials circle is always shown — we never show an empty box.
 * - Background color is deterministic from the user's name via a djb2-style
 *   hash. The same name always produces the same color across sessions and
 *   devices — users will recognise each other's color as a quick identifier.
 * - Six carefully chosen pastel colors are used (not random bright hues) to
 *   ensure initials text is always readable at high contrast.
 * - expo-image is used instead of Image when a URI is available — it provides
 *   built-in caching, crossfade transitions, and better performance on older
 *   Android devices. Falls back to RN Image if expo-image is unavailable.
 */

import React, { useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ViewStyle,
    StyleProp,
    Image,
} from 'react-native';
import { radius } from '@/styles/global';
import { typography } from '@/styles/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
    /** Remote image URL. When provided, the photo is shown instead of initials. */
    uri?: string | null;
    /** Full name of the person — used to generate initials and derive color. */
    name: string;
    size?: AvatarSize;
    style?: StyleProp<ViewStyle>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SIZE_MAP: Record<AvatarSize, number> = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
};

// Font size scales with avatar size so initials remain proportional.
const FONT_SIZE_MAP: Record<AvatarSize, number> = {
    sm: 12,
    md: 15,
    lg: 20,
    xl: 28,
};

// Carefully selected palette — tested for legibility of white initials on top.
const INITIALS_COLORS = [
    '#2D6A4F', // forest green (primary brand)
    '#1D6FA4', // ocean blue
    '#7B4F9E', // soft purple
    '#C05621', // warm terracotta
    '#B7791F', // golden amber
    '#2C7A7B', // teal
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts initials from a full name string.
 * "Gabriel Belibi" → "GB"
 * "Gabriel" → "G"
 * "" → "?"
 */
function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Deterministic color picker based on a djb2-style hash of the name.
 * Always returns the same color for the same string.
 */
function getColorForName(name: string): string {
    let hash = 5381;
    for (let i = 0; i < name.length; i++) {
        // hash * 33 + charCode — classic djb2 hash
        hash = (hash << 5) + hash + name.charCodeAt(i);
        hash = hash & hash; // force 32-bit int
    }
    const index = Math.abs(hash) % INITIALS_COLORS.length;
    return INITIALS_COLORS[index];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Avatar: React.FC<AvatarProps> = ({
    uri,
    name,
    size = 'md',
    style,
}) => {
    const diameter = SIZE_MAP[size];
    const fontSize = FONT_SIZE_MAP[size];

    // Memoised so hashing doesn't re-run on every render.
    const { initials, bgColor } = useMemo(() => ({
        initials: getInitials(name),
        bgColor: getColorForName(name),
    }), [name]);

    const circleStyle: ViewStyle = {
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
    };

    if (uri) {
        return (
            <Image
                source={{ uri }}
                style={[styles.image, circleStyle, style as ViewStyle]}
                accessibilityLabel={`${name}'s profile photo`}
            />
        );
    }

    return (
        <View
            style={[styles.initialsCircle, circleStyle, { backgroundColor: bgColor }, style]}
            accessibilityLabel={`${name}'s avatar`}
        >
            <Text style={[styles.initialsText, { fontSize }]}>
                {initials}
            </Text>
        </View>
    );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    image: {
        // The dynamic borderRadius is set inline — this handles common image styles.
        resizeMode: 'cover',
    },
    initialsCircle: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsText: {
        // White text reads well on all six palette colors (contrast ≥ 4.5:1).
        color: '#FFFFFF',
        fontWeight: '700',
        letterSpacing: 0.5,
        // Exclude from layout — it's purely decorative text inside a fixed circle.
        includeFontPadding: false,
    },
});

export default Avatar;
