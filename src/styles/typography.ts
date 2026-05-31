/**
 * typography.ts — Text style scale for Belibi Tennis Coaching.
 *
 * Why a dedicated typography file?
 * Centralising font sizes, weights, and line-heights prevents the "font drift"
 * that happens when every developer picks slightly different sizes. It also
 * makes a font family swap (e.g. adding expo-google-fonts/Inter later) a
 * single-file change rather than a grep-and-replace across 30 screens.
 *
 * Font family strategy:
 * We use the system font stack now (no extra install needed). When you add
 * @expo-google-fonts/inter, change FONT_FAMILY_* below and every text
 * element in the app updates automatically.
 */

import { Platform, TextStyle } from 'react-native';
import { colors } from './global';

// ---------------------------------------------------------------------------
// Font family constants
// ---------------------------------------------------------------------------

// Platform-appropriate system sans-serif as fallback until Inter is installed.
const FONT_FAMILY_REGULAR =
    Platform.select({ ios: 'System', android: 'Roboto', default: 'System' });

// When @expo-google-fonts/inter is loaded, swap both constants to:
//   'Inter_400Regular'  /  'Inter_600SemiBold'  /  'Inter_700Bold'
const FONT_FAMILY_MEDIUM =
    Platform.select({ ios: 'System', android: 'Roboto', default: 'System' });

const FONT_FAMILY_BOLD =
    Platform.select({ ios: 'System', android: 'Roboto', default: 'System' });

// ---------------------------------------------------------------------------
// Raw scale — numeric tokens used to build text styles below.
// ---------------------------------------------------------------------------

export const fontSizes = {
    display: 32,
    h1: 28,
    h2: 24,
    h3: 20,
    h4: 17,
    bodyLarge: 17,
    body: 15,
    bodySmall: 13,
    label: 13,
    caption: 12,
} as const;

export const lineHeights = {
    display: 40,
    h1: 36,
    h2: 32,
    h3: 28,
    h4: 24,
    bodyLarge: 26,
    body: 22,
    bodySmall: 20,
    label: 18,
    caption: 16,
} as const;

// ---------------------------------------------------------------------------
// Composed text styles — import these into StyleSheet.create or style props.
// Each style is a complete TextStyle object ready to spread.
// ---------------------------------------------------------------------------

export const typography = {
    // Hero display text — coach dashboard headers, onboarding titles.
    display: {
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: fontSizes.display,
        lineHeight: lineHeights.display,
        fontWeight: '700' as TextStyle['fontWeight'],
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },

    // Page-level headings.
    h1: {
        fontFamily: FONT_FAMILY_BOLD,
        fontSize: fontSizes.h1,
        lineHeight: lineHeights.h1,
        fontWeight: '700' as TextStyle['fontWeight'],
        color: colors.textPrimary,
        letterSpacing: -0.3,
    },

    // Section headings (e.g. "Upcoming Sessions").
    h2: {
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: fontSizes.h2,
        lineHeight: lineHeights.h2,
        fontWeight: '600' as TextStyle['fontWeight'],
        color: colors.textPrimary,
    },

    // Card titles, list item headings.
    h3: {
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: fontSizes.h3,
        lineHeight: lineHeights.h3,
        fontWeight: '600' as TextStyle['fontWeight'],
        color: colors.textPrimary,
    },

    // Sub-section labels, modal section headers.
    h4: {
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: fontSizes.h4,
        lineHeight: lineHeights.h4,
        fontWeight: '600' as TextStyle['fontWeight'],
        color: colors.textPrimary,
    },

    // Comfortable reading size for prominent body copy.
    bodyLarge: {
        fontFamily: FONT_FAMILY_REGULAR,
        fontSize: fontSizes.bodyLarge,
        lineHeight: lineHeights.bodyLarge,
        fontWeight: '400' as TextStyle['fontWeight'],
        color: colors.textPrimary,
    },

    // Standard body text — the most-used style in the app.
    body: {
        fontFamily: FONT_FAMILY_REGULAR,
        fontSize: fontSizes.body,
        lineHeight: lineHeights.body,
        fontWeight: '400' as TextStyle['fontWeight'],
        color: colors.textPrimary,
    },

    // Secondary info, metadata, list subtitles.
    bodySmall: {
        fontFamily: FONT_FAMILY_REGULAR,
        fontSize: fontSizes.bodySmall,
        lineHeight: lineHeights.bodySmall,
        fontWeight: '400' as TextStyle['fontWeight'],
        color: colors.textSecondary,
    },

    // Badge labels, chip text, form field labels — semibold for legibility at small size.
    label: {
        fontFamily: FONT_FAMILY_MEDIUM,
        fontSize: fontSizes.label,
        lineHeight: lineHeights.label,
        fontWeight: '600' as TextStyle['fontWeight'],
        color: colors.textPrimary,
        letterSpacing: 0.1,
    },

    // Timestamps, fine print, input hints.
    caption: {
        fontFamily: FONT_FAMILY_REGULAR,
        fontSize: fontSizes.caption,
        lineHeight: lineHeights.caption,
        fontWeight: '400' as TextStyle['fontWeight'],
        color: colors.textSecondary,
    },
} as const;
