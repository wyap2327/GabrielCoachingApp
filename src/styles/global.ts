/**
 * global.ts — Central design token file for Belibi Tennis Coaching.
 *
 * All color decisions live here. No screen or component should hardcode
 * a hex value — always import from this file so a future rebrand only
 * requires touching one place.
 */

import { StyleSheet } from 'react-native';

// ---------------------------------------------------------------------------
// Color tokens
// ---------------------------------------------------------------------------

export const colors = {
    // --- Backgrounds ---
    // White canvas keeps the UI feeling open and premium.
    background: '#FFFFFF',
    // Slightly off-white surface for cards/panels — creates depth without shadow overuse.
    surface: '#F8F9FA',
    // A second elevated surface level (e.g. modal sheets, input backgrounds).
    surfaceHigh: '#F1F3F5',

    // --- Primary brand — deep forest tennis green ---
    // #2D6A4F is more professional and readable than bright #4CAF50.
    // It passes WCAG AA contrast on white at all text sizes.
    primary: '#2D6A4F',
    // Lighter variant used for pressed states, tinted backgrounds, and icon fills.
    primaryLight: '#52B788',
    // Very light tint — used for badge backgrounds, selected state fills.
    primaryTint: '#D8F3DC',

    // --- Accent — tennis ball yellow-green ---
    // Used *sparingly*: active tab indicator, streak badges, highlight pills.
    // Never use as text color on white — poor contrast.
    accent: '#C8E800',
    // Darker accent shade safe for text on the accent background.
    accentDark: '#8FAE00',

    // --- Text ---
    // Near-black with a blue undertone — softer than pure black on white screens.
    textPrimary: '#1A1A2E',
    // Mid-grey for secondary labels, placeholders, metadata.
    textSecondary: '#6B7280',
    // Light grey for disabled text, captions.
    textMuted: '#9CA3AF',
    // White text — used on primary/dark backgrounds.
    textInverse: '#FFFFFF',

    // --- Borders & dividers ---
    border: '#E5E7EB',
    // Stronger border for focused inputs.
    borderFocus: '#2D6A4F',
    borderError: '#EF4444',

    // --- Semantic status colors ---
    error: '#EF4444',
    errorTint: '#FEE2E2',
    success: '#10B981',
    successTint: '#D1FAE5',
    warning: '#F59E0B',
    warningTint: '#FEF3C7',
    info: '#3B82F6',
    infoTint: '#DBEAFE',

    // --- Tab bar ---
    // Tab bar stays white to match the main background.
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',

    // --- Misc ---
    // Semi-transparent overlay for modals/sheets.
    overlay: 'rgba(26, 26, 46, 0.5)',
    transparent: 'transparent',
} as const;

// ---------------------------------------------------------------------------
// Border radius tokens
// ---------------------------------------------------------------------------
// Using a named scale avoids magic numbers scattered across files.

export const radius = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    // Full pill — use for badges and chips.
    full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Legacy globalStyles — kept for backward compatibility with existing screens.
// New screens should compose styles using the token exports above rather than
// importing this StyleSheet directly.
// ---------------------------------------------------------------------------

export const globalStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
        marginTop: 24,
        marginBottom: 12,
    },
    empty: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
