/**
 * spacing.ts — Layout rhythm tokens for Belibi Tennis Coaching.
 *
 * Why a 4-point base grid?
 * Multiples of 4 are the industry standard (used by Material Design, Apple HIG,
 * and Figma's default grid). Every value here is a multiple of 4, so spacing
 * always aligns to the underlying grid — no sub-pixel gaps or misaligned edges.
 *
 * Usage:
 *   import { spacing, layout } from '@/styles/spacing';
 *   paddingHorizontal: spacing.base   // 16
 *   paddingVertical:   spacing.md     // 12
 *   gap:               layout.sectionGap  // 24
 */

// ---------------------------------------------------------------------------
// Base spacing scale
// ---------------------------------------------------------------------------

export const spacing = {
    /** 4px  — tight internal padding, icon-to-label gaps */
    xs: 4,
    /** 8px  — small gaps between related elements */
    sm: 8,
    /** 12px — inner card padding, between label and input */
    md: 12,
    /** 16px — standard screen horizontal padding, default component padding */
    base: 16,
    /** 20px — comfortable vertical gap between sections */
    lg: 20,
    /** 24px — section-to-section spacing, card bottom margin */
    xl: 24,
    /** 32px — large vertical breathing room, modal padding */
    xxl: 32,
    /** 48px — hero area padding, onboarding top spacing */
    xxxl: 48,
} as const;

// ---------------------------------------------------------------------------
// Layout constants — semantic aliases for common screen-level decisions.
// ---------------------------------------------------------------------------

export const layout = {
    /**
     * Standard horizontal padding applied to every screen's root container.
     * Keeps content inset from the device edge consistently.
     */
    screenPadding: spacing.base,      // 16

    /**
     * Padding inside cards and surface containers.
     * Slightly tighter than screen padding to feel contained.
     */
    cardPadding: spacing.base,        // 16

    /**
     * Vertical gap between distinct content sections within a screen.
     */
    sectionGap: spacing.xl,           // 24

    /**
     * Maximum width for content on larger screens/tablets.
     * Wrap screen content in a centered container using this value.
     */
    maxContentWidth: 600,

    /**
     * Standard height for primary action buttons.
     */
    buttonHeight: {
        sm: 36,
        md: 48,
        lg: 56,
    },

    /**
     * Standard height for text inputs.
     */
    inputHeight: 52,

    /**
     * Tab bar total height (icon + label + bottom safe area).
     * Used when calculating scroll padding so content isn't hidden behind the tab bar.
     */
    tabBarHeight: 64,
} as const;
