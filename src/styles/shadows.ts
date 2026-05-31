/**
 * shadows.ts — Elevation tokens for Belibi Tennis Coaching.
 *
 * Why separate iOS and Android shadow APIs?
 * React Native exposes two completely different systems:
 *   iOS:     shadowColor, shadowOffset, shadowOpacity, shadowRadius
 *   Android: elevation (integer — maps to Material Design dp levels)
 * We combine both into single objects using Platform.select so that
 * each component just spreads one shadow token and gets the right
 * behaviour on both platforms without any conditional logic at the call site.
 *
 * Shadow philosophy:
 *   sm  — Subtle card lift (default for most surfaces)
 *   md  — Floating element (modals, dropdowns, toasts)
 *   lg  — Prominent overlay (bottom sheets, date pickers)
 */

import { Platform, ViewStyle } from 'react-native';

type ShadowStyle = Pick<
    ViewStyle,
    | 'shadowColor'
    | 'shadowOffset'
    | 'shadowOpacity'
    | 'shadowRadius'
    | 'elevation'
>;

// Using a neutral dark shadow color (not pure black) for a softer, more
// premium look — pure black (#000) tends to look harsh on white backgrounds.
const SHADOW_COLOR = '#1A1A2E';

export const shadows: Record<'sm' | 'md' | 'lg', ShadowStyle> = {
    /**
     * sm — Cards, list items, input fields.
     * Barely perceptible on white; adds just enough depth to separate surfaces.
     */
    sm: Platform.select({
        ios: {
            shadowColor: SHADOW_COLOR,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
        },
        android: {
            elevation: 2,
        },
        default: {
            shadowColor: SHADOW_COLOR,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
        },
    }) as ShadowStyle,

    /**
     * md — Floating action buttons, dropdown menus, snack bars.
     * Clearly elevated without being heavy.
     */
    md: Platform.select({
        ios: {
            shadowColor: SHADOW_COLOR,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
        },
        android: {
            elevation: 6,
        },
        default: {
            shadowColor: SHADOW_COLOR,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
        },
    }) as ShadowStyle,

    /**
     * lg — Bottom sheets, modals, full-screen overlays.
     * Maximum depth signal — used sparingly so hierarchy is clear.
     */
    lg: Platform.select({
        ios: {
            shadowColor: SHADOW_COLOR,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
        },
        android: {
            elevation: 12,
        },
        default: {
            shadowColor: SHADOW_COLOR,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
        },
    }) as ShadowStyle,
};
